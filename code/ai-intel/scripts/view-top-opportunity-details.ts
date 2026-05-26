#!/usr/bin/env tsx
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

console.log("\n" + "=".repeat(100));
console.log("📊 P0 级别机会详细分析（前5个）");
console.log("=".repeat(100) + "\n");

const topOpportunities = db
  .prepare("SELECT id, title, target_niche, score, pain_point_analysis, blueprint FROM opportunities WHERE priority = 'P0' ORDER BY score DESC LIMIT 5")
  .all() as any[];

topOpportunities.forEach((opp, idx) => {
  console.log(`${"━".repeat(100)}`);
  console.log(`【机会 ${idx + 1}】${opp.title}`);
  console.log(`目标: ${opp.target_niche}`);
  console.log(`评分: ${opp.score}`);
  console.log();
  console.log("痛点分析:");
  console.log(opp.pain_point_analysis);
  console.log();
});

console.log("\n" + "=".repeat(100));
