// Phase C: 趋势 + Why Now 核心逻辑
//
// 三层设计：
//   1. pain_mentions   —— 原始目击（最细粒度，每条 harvest 入 1 行）
//   2. trend_snapshots —— 每日聚合（定时任务写，用于画曲线）
//   3. why_now_score   —— 综合评分（增速 + 催化剂 + 新鲜度 + 多源）
//
// Why Now 评分公式（0-100）：
//     0.4 * growth_score      # 30 天提及量增速，>=50%/月 → 满分
//   + 0.3 * catalyst_score    # 命中相关催化剂（近 180 天内）
//   + 0.2 * recency_score     # 70% 以上提及在最近 60 天
//   + 0.1 * diversity_score   # 来自 ≥3 个不同平台
//
// final_priority_score = base_score * (0.6 + 0.4 * why_now_score/100)

import Database from "better-sqlite3";
import { getRawDB } from "./db";
import { matchCatalysts, type CatalystMatch } from "./catalysts";

function getDB(): Database.Database {
  return getRawDB();
}

// ─── 写入 mention ───

export interface MentionInput {
  cluster_id?: number | null;
  opportunity_id?: number | null;
  source_platform: string;
  mentioned_at: string; // ISO
  engagement?: number;
  sentiment?: number | null;
  text_sample?: string;
}

export function recordMention(m: MentionInput): number {
  return Number(
    getDB()
      .prepare(
        `INSERT INTO pain_mentions
          (cluster_id, opportunity_id, source_platform, mentioned_at, engagement, sentiment, text_sample)
         VALUES (@cluster_id, @opportunity_id, @source_platform, @mentioned_at, @engagement, @sentiment, @text_sample)`
      )
      .run({
        cluster_id: m.cluster_id ?? null,
        opportunity_id: m.opportunity_id ?? null,
        source_platform: m.source_platform,
        mentioned_at: m.mentioned_at,
        engagement: m.engagement ?? 0,
        sentiment: m.sentiment ?? null,
        text_sample: (m.text_sample ?? "").slice(0, 200),
      }).lastInsertRowid
  );
}

// ─── 聚合计算 ───

export interface ClusterTrend {
  cluster_id: number;
  mentions_7d: number;
  mentions_30d: number;
  mentions_90d: number;
  growth_7d_pct: number;   // (last_7d - prev_7d) / max(prev_7d, 1)
  growth_30d_pct: number;  // (last_30d - prev_30d) / max(prev_30d, 1)
  unique_sources_30d: number;
  last_mention_at: string | null;
  recency_ratio: number; // 最近 60 天 / 总提及
}

/** 计算单个 cluster 的趋势指标（不写库，仅返回） */
export function computeClusterTrend(cluster_id: number): ClusterTrend {
  const db = getDB();
  const now = Date.now();
  const iso = (ms: number) => new Date(now - ms).toISOString();
  const d7 = iso(7 * 86400_000);
  const d14 = iso(14 * 86400_000);
  const d30 = iso(30 * 86400_000);
  const d60 = iso(60 * 86400_000);
  const d90 = iso(90 * 86400_000);

  const q = (sinceIso: string, untilIso?: string) => {
    const sql = untilIso
      ? "SELECT COUNT(*) as c FROM pain_mentions WHERE cluster_id = ? AND mentioned_at >= ? AND mentioned_at < ?"
      : "SELECT COUNT(*) as c FROM pain_mentions WHERE cluster_id = ? AND mentioned_at >= ?";
    const args: any[] = untilIso
      ? [cluster_id, sinceIso, untilIso]
      : [cluster_id, sinceIso];
    return (db.prepare(sql).get(...args) as { c: number }).c ?? 0;
  };

  const mentions_7d = q(d7);
  const prev_7d = q(d14, d7);
  const mentions_30d = q(d30);
  const prev_30d = q(d60, d30);
  const mentions_90d = q(d90);
  const mentions_60d = q(d60);

  const total =
    (db
      .prepare("SELECT COUNT(*) as c FROM pain_mentions WHERE cluster_id = ?")
      .get(cluster_id) as { c: number }).c ?? 0;

  const uniqueSources =
    (db
      .prepare(
        "SELECT COUNT(DISTINCT source_platform) as c FROM pain_mentions WHERE cluster_id = ? AND mentioned_at >= ?"
      )
      .get(cluster_id, d30) as { c: number }).c ?? 0;

  const lastRow = db
    .prepare(
      "SELECT mentioned_at FROM pain_mentions WHERE cluster_id = ? ORDER BY mentioned_at DESC LIMIT 1"
    )
    .get(cluster_id) as { mentioned_at: string } | undefined;

  return {
    cluster_id,
    mentions_7d,
    mentions_30d,
    mentions_90d,
    growth_7d_pct: (mentions_7d - prev_7d) / Math.max(prev_7d, 1),
    growth_30d_pct: (mentions_30d - prev_30d) / Math.max(prev_30d, 1),
    unique_sources_30d: uniqueSources,
    last_mention_at: lastRow?.mentioned_at ?? null,
    recency_ratio: total > 0 ? mentions_60d / total : 0,
  };
}

// ─── Why Now 评分 ───

export interface WhyNow {
  score: number;               // 0-100
  growth_score: number;        // 0-100
  catalyst_score: number;      // 0-100
  recency_score: number;       // 0-100
  diversity_score: number;     // 0-100
  matched_catalysts: CatalystMatch[];
  label: "爆发中" | "升温中" | "稳定" | "停滞" | "无数据";
  /** 建议的窗口期（月） —— 基于增速粗估 */
  window_months: number;
}

export function computeWhyNow(
  trend: ClusterTrend,
  tags: string,
  title = "",
  niche = ""
): WhyNow {
  // --- 1) 增速分：月增速 30% 线性，>=50% 满分
  const g30 = trend.growth_30d_pct;
  const growthScore = Math.max(0, Math.min(100, (g30 / 0.5) * 100));

  // --- 2) 催化剂分：近 180 天内命中的催化剂
  const matches = matchCatalysts({
    text: `${title} ${niche} ${tags}`,
    withinDays: 180,
  });
  const catalystScore = Math.min(
    100,
    matches.reduce((s, m) => s + m.weight * 40, 0) // 每个命中 40*weight，封顶 100
  );

  // --- 3) 新鲜度分
  const recencyScore = trend.recency_ratio * 100;

  // --- 4) 多源分
  const diversityScore = Math.min(100, ((trend.unique_sources_30d - 1) / 3) * 100);

  const score = Math.round(
    0.4 * growthScore +
      0.3 * catalystScore +
      0.2 * recencyScore +
      0.1 * diversityScore
  );

  let label: WhyNow["label"];
  if (trend.mentions_30d === 0 && matches.length === 0) label = "无数据";
  else if (score >= 75) label = "爆发中";
  else if (score >= 50) label = "升温中";
  else if (score >= 25) label = "稳定";
  else label = "停滞";

  // 窗口期粗估：增速越快窗口越短
  let window_months: number;
  if (g30 >= 1.0) window_months = 3;
  else if (g30 >= 0.5) window_months = 6;
  else if (g30 >= 0.2) window_months = 12;
  else window_months = 24;

  return {
    score,
    growth_score: Math.round(growthScore),
    catalyst_score: Math.round(catalystScore),
    recency_score: Math.round(recencyScore),
    diversity_score: Math.round(diversityScore),
    matched_catalysts: matches,
    label,
    window_months,
  };
}

// ─── 每日快照 ───

/** 把所有 cluster 的当前趋势写入 trend_snapshots 表（按天幂等） */
export function writeTrendSnapshots(date?: string): number {
  const db = getDB();
  const today = date ?? new Date().toISOString().slice(0, 10);
  const clusters = db
    .prepare("SELECT id FROM clusters")
    .all() as { id: number }[];

  const insert = db.prepare(
    `INSERT OR REPLACE INTO trend_snapshots
      (date, cluster_id, mentions_7d, mentions_30d, mentions_90d, growth_7d_pct, growth_30d_pct, unique_sources)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction((rows: { id: number }[]) => {
    let n = 0;
    for (const r of rows) {
      const t = computeClusterTrend(r.id);
      insert.run(
        today,
        r.id,
        t.mentions_7d,
        t.mentions_30d,
        t.mentions_90d,
        t.growth_7d_pct,
        t.growth_30d_pct,
        t.unique_sources_30d
      );
      n++;
    }
    return n;
  });

  return tx(clusters);
}

/** 最近 N 天的快照曲线（for UI 画图） */
export function getTrendHistory(cluster_id: number, days = 30) {
  return getDB()
    .prepare(
      `SELECT date, mentions_7d, mentions_30d, growth_30d_pct, unique_sources
       FROM trend_snapshots
       WHERE cluster_id = ?
       ORDER BY date DESC LIMIT ?`
    )
    .all(cluster_id, days) as any[];
}
