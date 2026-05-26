#!/usr/bin/env tsx
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

console.log("\n" + "=".repeat(100));
console.log("📊 数据库中的所有机会");
console.log("=".repeat(100) + "\n");

const allOpportunities = db
  .prepare("SELECT id, title, target_niche, score, priority, created_at, source_platform FROM opportunities ORDER BY score DESC")
  .all() as any[];

console.log(`✅ 共有 ${allOpportunities.length} 个机会\n`);

allOpportunities.forEach((opp, idx) => {
  console.log(`${idx + 1}. 【${opp.priority}】${opp.title}`);
  console.log(`   目标: ${opp.target_niche}`);
  console.log(`   评分: ${opp.score}`);
  console.log(`   来源: ${opp.source_platform}`);
  console.log(`   创建时间: ${opp.created_at}`);
  console.log();
});

console.log("\n" + "=".repeat(100));
console.log("📈 统计信息");
console.log("=".repeat(100) + "\n");

const stats = db
  .prepare("SELECT priority, COUNT(*) as count FROM opportunities GROUP BY priority ORDER BY priority")
  .all() as any[];

stats.forEach((s) => {
  console.log(`${s.priority}: ${s.count} 个`);
});

const avgScore = db
  .prepare("SELECT AVG(score) as avg_score FROM opportunities")
  .get() as any;

console.log(`\n平均评分: ${avgScore.avg_score.toFixed(2)}`);

console.log("\n" + "=".repeat(100));
