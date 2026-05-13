// SQLite 持久层 v4：opportunities + artifacts + runs + embeddings + clusters
// 检测到旧 schema（无 cost_usd / 无 artifacts 表）自动备份重建
// 新增表（opportunity_embeddings / clusters / opportunities.cluster_id）走增量 migration，不重建

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  Artifact,
  ArtifactKind,
  Opportunity,
  Priority,
  Run,
} from "./types";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const g = globalThis as unknown as { __intelDb?: Database.Database };

function needsRebuild(db: Database.Database): boolean {
  const t = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='opportunities'"
    )
    .get() as { name?: string } | undefined;
  if (!t?.name) return false; // 全新库
  const cols = db
    .prepare("PRAGMA table_info(opportunities)")
    .all() as { name: string }[];
  const hasCost = cols.some((c) => c.name === "cost_usd");
  const hasBlueprint = cols.some((c) => c.name === "blueprint");
  return !hasCost || !hasBlueprint;
}

function getDB(): Database.Database {
  if (!g.__intelDb) {
    let db = new Database(DB_PATH);
    if (needsRebuild(db)) {
      db.close();
      const backup = DB_PATH.replace(/\.db$/, `.bak-${Date.now()}.db`);
      fs.renameSync(DB_PATH, backup);
      // eslint-disable-next-line no-console
      console.warn(`[db] 旧 schema 已备份到 ${backup}，重建新库`);
      db = new Database(DB_PATH);
    }
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        source_platform TEXT NOT NULL,
        source_url TEXT,
        raw_text TEXT NOT NULL,

        title TEXT NOT NULL,
        target_niche TEXT NOT NULL,
        pain_point_analysis TEXT NOT NULL,
        build_once_sell_infinite INTEGER NOT NULL DEFAULT 0,
        score INTEGER NOT NULL,
        priority TEXT NOT NULL,
        tags TEXT DEFAULT '',
        blueprint TEXT DEFAULT '',
        has_blueprint INTEGER NOT NULL DEFAULT 0,
        analysis_json TEXT NOT NULL,

        tokens_in INTEGER NOT NULL DEFAULT 0,
        tokens_out INTEGER NOT NULL DEFAULT 0,
        cost_usd REAL NOT NULL DEFAULT 0,

        favorite INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_opp_score ON opportunities(score DESC);
      CREATE INDEX IF NOT EXISTS idx_opp_created ON opportunities(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_opp_niche ON opportunities(target_niche);
      CREATE INDEX IF NOT EXISTS idx_opp_blueprint ON opportunities(has_blueprint);

      CREATE TABLE IF NOT EXISTS artifacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        opportunity_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        content TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'md',
        tokens_in INTEGER NOT NULL DEFAULT 0,
        tokens_out INTEGER NOT NULL DEFAULT 0,
        cost_usd REAL NOT NULL DEFAULT 0,
        FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_art_unique ON artifacts(opportunity_id, kind);
      CREATE INDEX IF NOT EXISTS idx_art_kind ON artifacts(kind);

      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        ended_at TEXT,
        label TEXT DEFAULT '',
        items_total INTEGER NOT NULL DEFAULT 0,
        items_ok INTEGER NOT NULL DEFAULT 0,
        items_err INTEGER NOT NULL DEFAULT 0,
        p0_count INTEGER NOT NULL DEFAULT 0,
        p1_count INTEGER NOT NULL DEFAULT 0,
        total_cost_usd REAL NOT NULL DEFAULT 0,
        budget_usd REAL NOT NULL DEFAULT 0
      );

      -- ========== Phase A: 聚类去重 ==========
      CREATE TABLE IF NOT EXISTS clusters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        canonical_opportunity_id INTEGER,
        member_count INTEGER NOT NULL DEFAULT 0,
        tags_merged TEXT DEFAULT '',
        title_sample TEXT DEFAULT '',
        niche_sample TEXT DEFAULT '',
        max_score INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(canonical_opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cluster_score ON clusters(max_score DESC);

      CREATE TABLE IF NOT EXISTS opportunity_embeddings (
        opportunity_id INTEGER PRIMARY KEY,
        embedding BLOB NOT NULL,
        dim INTEGER NOT NULL,
        model TEXT NOT NULL,
        cluster_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY(cluster_id) REFERENCES clusters(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_emb_cluster ON opportunity_embeddings(cluster_id);
    `);

    // opportunities 表增量列（旧库升级路径）
    const oppCols = db
      .prepare("PRAGMA table_info(opportunities)")
      .all() as { name: string }[];
    if (!oppCols.some((c) => c.name === "cluster_id")) {
      db.exec("ALTER TABLE opportunities ADD COLUMN cluster_id INTEGER");
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_opp_cluster ON opportunities(cluster_id)"
      );
    }
    g.__intelDb = db;
  }
  return g.__intelDb!;
}

// ---------- Opportunities ----------

export type NewOpportunity = Omit<Opportunity, "id" | "created_at">;

export function insertOpportunity(o: NewOpportunity): number {
  const stmt = getDB().prepare(`
    INSERT INTO opportunities (
      source_platform, source_url, raw_text,
      title, target_niche, pain_point_analysis, build_once_sell_infinite,
      score, priority, tags, blueprint, has_blueprint, analysis_json,
      tokens_in, tokens_out, cost_usd, favorite
    ) VALUES (
      @source_platform, @source_url, @raw_text,
      @title, @target_niche, @pain_point_analysis, @build_once_sell_infinite,
      @score, @priority, @tags, @blueprint, @has_blueprint, @analysis_json,
      @tokens_in, @tokens_out, @cost_usd, @favorite
    )
  `);
  return Number(stmt.run(o).lastInsertRowid);
}

export interface ListParams {
  limit?: number;
  offset?: number;
  niche?: string;
  minScore?: number;
  favoriteOnly?: boolean;
  hasBlueprint?: boolean;
  q?: string;
  priority?: Priority;
}

export function listOpportunities(p: ListParams = {}): Opportunity[] {
  const {
    limit = 50,
    offset = 0,
    niche,
    minScore,
    favoriteOnly,
    hasBlueprint,
    q,
    priority,
  } = p;
  const where: string[] = [];
  const params: Record<string, unknown> = { limit, offset };
  if (niche) {
    where.push("target_niche = @niche");
    params.niche = niche;
  }
  if (typeof minScore === "number") {
    where.push("score >= @minScore");
    params.minScore = minScore;
  }
  if (priority) {
    where.push("priority = @priority");
    params.priority = priority;
  }
  if (favoriteOnly) where.push("favorite = 1");
  if (hasBlueprint) where.push("has_blueprint = 1");
  if (q) {
    where.push(
      "(title LIKE @q OR pain_point_analysis LIKE @q OR target_niche LIKE @q OR tags LIKE @q)"
    );
    params.q = `%${q}%`;
  }
  const sql = `
    SELECT * FROM opportunities
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY score DESC, created_at DESC
    LIMIT @limit OFFSET @offset
  `;
  return getDB().prepare(sql).all(params) as Opportunity[];
}

export function getOpportunity(id: number): Opportunity | undefined {
  return getDB()
    .prepare("SELECT * FROM opportunities WHERE id = ?")
    .get(id) as Opportunity | undefined;
}

export function toggleFavorite(id: number): boolean {
  const row = getOpportunity(id);
  if (!row) return false;
  const next = row.favorite ? 0 : 1;
  getDB()
    .prepare("UPDATE opportunities SET favorite = ? WHERE id = ?")
    .run(next, id);
  return !!next;
}

export function updateTags(id: number, tags: string): void {
  getDB()
    .prepare("UPDATE opportunities SET tags = ? WHERE id = ?")
    .run(tags, id);
}

export function deleteOpportunity(id: number): void {
  getDB().prepare("DELETE FROM opportunities WHERE id = ?").run(id);
}

// ---------- Artifacts ----------

export function upsertArtifact(a: Omit<Artifact, "id" | "created_at">): number {
  const db = getDB();
  db.prepare(
    `INSERT OR REPLACE INTO artifacts
     (opportunity_id, kind, content, format, tokens_in, tokens_out, cost_usd)
     VALUES (@opportunity_id, @kind, @content, @format, @tokens_in, @tokens_out, @cost_usd)`
  ).run(a);
  const row = db
    .prepare(
      "SELECT id FROM artifacts WHERE opportunity_id = ? AND kind = ?"
    )
    .get(a.opportunity_id, a.kind) as { id: number } | undefined;
  return row?.id ?? 0;
}

export function listArtifacts(opportunity_id: number): Artifact[] {
  return getDB()
    .prepare(
      "SELECT * FROM artifacts WHERE opportunity_id = ? ORDER BY created_at DESC"
    )
    .all(opportunity_id) as Artifact[];
}

export function hasArtifact(
  opportunity_id: number,
  kind: ArtifactKind
): boolean {
  const row = getDB()
    .prepare(
      "SELECT 1 as x FROM artifacts WHERE opportunity_id = ? AND kind = ?"
    )
    .get(opportunity_id, kind);
  return !!row;
}

// ---------- Runs ----------

export function startRun(
  label: string,
  items_total: number,
  budget_usd: number
): number {
  return Number(
    getDB()
      .prepare(
        "INSERT INTO runs (label, items_total, budget_usd) VALUES (?, ?, ?)"
      )
      .run(label, items_total, budget_usd).lastInsertRowid
  );
}

export function finishRun(
  id: number,
  patch: Partial<Run>
): void {
  const fields = Object.keys(patch);
  if (!fields.length) return;
  const sql = `UPDATE runs SET ended_at = datetime('now'), ${fields
    .map((f) => `${f} = @${f}`)
    .join(", ")} WHERE id = @id`;
  getDB()
    .prepare(sql)
    .run({ ...patch, id });
}

// ---------- Stats ----------

export interface Stats {
  total: number;
  can_ship: number;
  avg_score: number;
  max_score: number;
  total_cost_usd: number;
  by_niche: { target_niche: string; count: number; avg_score: number }[];
  by_priority: { priority: string; count: number }[];
  top_opportunities: {
    id: number;
    title: string;
    target_niche: string;
    score: number;
    has_blueprint: number;
  }[];
  trending: { day: string; count: number }[];
  recent_runs: Run[];
}

export function getStats(): Stats {
  const db = getDB();
  const total =
    (db.prepare("SELECT COUNT(*) as c FROM opportunities").get() as any).c ?? 0;
  const can_ship =
    (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM opportunities WHERE has_blueprint = 1 AND score >= 80"
        )
        .get() as any
    ).c ?? 0;
  const agg = db
    .prepare(
      "SELECT AVG(score) a, MAX(score) m, COALESCE(SUM(cost_usd),0) s FROM opportunities"
    )
    .get() as any;
  const artCost =
    (db.prepare("SELECT COALESCE(SUM(cost_usd),0) s FROM artifacts").get() as any)
      .s ?? 0;

  return {
    total,
    can_ship,
    avg_score: Math.round(agg?.a ?? 0),
    max_score: agg?.m ?? 0,
    total_cost_usd: Number(((agg?.s ?? 0) + (artCost ?? 0)).toFixed(4)),
    by_niche: db
      .prepare(
        `SELECT target_niche, COUNT(*) count, ROUND(AVG(score)) avg_score
         FROM opportunities GROUP BY target_niche
         ORDER BY avg_score DESC, count DESC LIMIT 12`
      )
      .all() as any[],
    by_priority: db
      .prepare(
        "SELECT priority, COUNT(*) count FROM opportunities GROUP BY priority ORDER BY priority"
      )
      .all() as any[],
    top_opportunities: db
      .prepare(
        `SELECT id, title, target_niche, score, has_blueprint
         FROM opportunities ORDER BY score DESC, created_at DESC LIMIT 10`
      )
      .all() as any[],
    trending: db
      .prepare(
        `SELECT substr(created_at,1,10) day, COUNT(*) count
         FROM opportunities GROUP BY day ORDER BY day DESC LIMIT 14`
      )
      .all() as any[],
    recent_runs: db
      .prepare("SELECT * FROM runs ORDER BY id DESC LIMIT 5")
      .all() as Run[],
  };
}



// ---------- Embeddings / Clusters (Phase A) ----------

export interface EmbeddingRow {
  opportunity_id: number;
  embedding: Float32Array;
  dim: number;
  model: string;
  cluster_id: number | null;
}

function float32ToBlob(v: Float32Array): Buffer {
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}

function blobToFloat32(b: Buffer): Float32Array {
  // 复制一份避免 SQLite 内存被重用
  const ab = new ArrayBuffer(b.length);
  new Uint8Array(ab).set(b);
  return new Float32Array(ab);
}

export function saveEmbedding(
  opportunity_id: number,
  embedding: Float32Array,
  model: string,
  cluster_id: number | null = null
): void {
  getDB()
    .prepare(
      `INSERT OR REPLACE INTO opportunity_embeddings
         (opportunity_id, embedding, dim, model, cluster_id)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(opportunity_id, float32ToBlob(embedding), embedding.length, model, cluster_id);
}

export function getEmbedding(opportunity_id: number): EmbeddingRow | null {
  const row = getDB()
    .prepare(
      "SELECT opportunity_id, embedding, dim, model, cluster_id FROM opportunity_embeddings WHERE opportunity_id = ?"
    )
    .get(opportunity_id) as
    | {
        opportunity_id: number;
        embedding: Buffer;
        dim: number;
        model: string;
        cluster_id: number | null;
      }
    | undefined;
  if (!row) return null;
  return {
    opportunity_id: row.opportunity_id,
    embedding: blobToFloat32(row.embedding),
    dim: row.dim,
    model: row.model,
    cluster_id: row.cluster_id,
  };
}

export function allEmbeddings(excludeOppId?: number): EmbeddingRow[] {
  const sql = excludeOppId
    ? "SELECT opportunity_id, embedding, dim, model, cluster_id FROM opportunity_embeddings WHERE opportunity_id != ?"
    : "SELECT opportunity_id, embedding, dim, model, cluster_id FROM opportunity_embeddings";
  const rows = (
    excludeOppId
      ? getDB().prepare(sql).all(excludeOppId)
      : getDB().prepare(sql).all()
  ) as {
    opportunity_id: number;
    embedding: Buffer;
    dim: number;
    model: string;
    cluster_id: number | null;
  }[];
  return rows.map((r) => ({
    opportunity_id: r.opportunity_id,
    embedding: blobToFloat32(r.embedding),
    dim: r.dim,
    model: r.model,
    cluster_id: r.cluster_id,
  }));
}

export interface ClusterRow {
  id: number;
  created_at: string;
  updated_at: string;
  canonical_opportunity_id: number | null;
  member_count: number;
  tags_merged: string;
  title_sample: string;
  niche_sample: string;
  max_score: number;
}

export function createCluster(canonical_opportunity_id: number): number {
  const opp = getOpportunity(canonical_opportunity_id);
  if (!opp) throw new Error(`opportunity #${canonical_opportunity_id} not found`);
  const id = Number(
    getDB()
      .prepare(
        `INSERT INTO clusters
           (canonical_opportunity_id, member_count, tags_merged, title_sample, niche_sample, max_score)
         VALUES (?, 1, ?, ?, ?, ?)`
      )
      .run(
        canonical_opportunity_id,
        opp.tags,
        opp.title,
        opp.target_niche,
        opp.score
      ).lastInsertRowid
  );
  return id;
}

export function assignClusterToOpp(opportunity_id: number, cluster_id: number): void {
  const db = getDB();
  db.prepare("UPDATE opportunities SET cluster_id = ? WHERE id = ?").run(
    cluster_id,
    opportunity_id
  );
  db.prepare(
    "UPDATE opportunity_embeddings SET cluster_id = ? WHERE opportunity_id = ?"
  ).run(cluster_id, opportunity_id);
}

/** 重新计算一个 cluster 的聚合字段 */
export function recomputeCluster(cluster_id: number): void {
  const db = getDB();
  const members = db
    .prepare(
      "SELECT id, title, target_niche, tags, score FROM opportunities WHERE cluster_id = ? ORDER BY score DESC, has_blueprint DESC, id DESC"
    )
    .all(cluster_id) as {
    id: number;
    title: string;
    target_niche: string;
    tags: string;
    score: number;
  }[];

  if (members.length === 0) {
    db.prepare("DELETE FROM clusters WHERE id = ?").run(cluster_id);
    return;
  }
  const canonical = members[0]; // 分数最高
  const allTags = new Set<string>();
  for (const m of members) {
    (m.tags || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => allTags.add(t));
  }
  const maxScore = Math.max(...members.map((m) => m.score));
  db.prepare(
    `UPDATE clusters
     SET canonical_opportunity_id = ?, member_count = ?, tags_merged = ?,
         title_sample = ?, niche_sample = ?, max_score = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    canonical.id,
    members.length,
    Array.from(allTags).slice(0, 12).join(","),
    canonical.title,
    canonical.target_niche,
    maxScore,
    cluster_id
  );
}

export function listClusters(limit = 50): (ClusterRow & {
  canonical?: Opportunity;
  members: Opportunity[];
})[] {
  const db = getDB();
  const clusters = db
    .prepare(
      "SELECT * FROM clusters ORDER BY max_score DESC, updated_at DESC LIMIT ?"
    )
    .all(limit) as ClusterRow[];
  return clusters.map((c) => {
    const members = db
      .prepare(
        "SELECT * FROM opportunities WHERE cluster_id = ? ORDER BY score DESC, created_at DESC"
      )
      .all(c.id) as Opportunity[];
    const canonical = c.canonical_opportunity_id
      ? (db
          .prepare("SELECT * FROM opportunities WHERE id = ?")
          .get(c.canonical_opportunity_id) as Opportunity | undefined)
      : undefined;
    return { ...c, canonical, members };
  });
}

export function getClusterStats(): { total: number; avg_members: number; largest: number } {
  const db = getDB();
  const r = db
    .prepare(
      "SELECT COUNT(*) total, COALESCE(AVG(member_count),0) avg_m, COALESCE(MAX(member_count),0) max_m FROM clusters"
    )
    .get() as any;
  return {
    total: r.total ?? 0,
    avg_members: Number((r.avg_m ?? 0).toFixed(2)),
    largest: r.max_m ?? 0,
  };
}
