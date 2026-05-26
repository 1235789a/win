#!/usr/bin/env tsx
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

console.log("\n" + "=".repeat(100));
console.log("🆕 本次新抓取的P0机会");
console.log("=".repeat(100) + "\n");

// 查看最近创建的机会（按时间倒序）
const newOpportunities = db
  .prepare("SELECT id, title, target_niche, score, priority, pain_point_analysis, created_at FROM opportunities ORDER BY id DESC LIMIT 10")
  .all() as any[];

newOpportunities.forEach((opp, idx) => {
  const priorityIcon = opp.priority === "P0" ? "🔥" : opp.priority === "P1" ? "📈" : "  ";
  console.log(`${priorityIcon} [${opp.priority}] ${opp.title}`);
  console.log(`   评分: ${opp.score} | 目标: ${opp.target_niche}`);
  console.log(`   创建时间: ${opp.created_at}`);
  console.log();
  if (opp.pain_point_analysis) {
    console.log(`   痛点分析: ${opp.pain_point_analysis.slice(0, 200)}...`);
    console.log();
  }
});

console.log("\n" + "=".repeat(100));
console.log("📊 总统计");
console.log("=".repeat(100) + "\n");

const stats = db
  .prepare("SELECT priority, COUNT(*) as cnt FROM opportunities GROUP BY priority ORDER BY priority")
  .all() as any[];

stats.forEach((s) => {
  console.log(`${s.priority}: ${s.cnt} 个`);
});

console.log("\n" + "=".repeat(100));
