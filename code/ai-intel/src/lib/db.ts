// SQLite 持久层 v3：opportunities + artifacts + runs
// 检测到旧 schema（无 cost_usd / 无 artifacts 表）自动备份重建

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
    `);
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
