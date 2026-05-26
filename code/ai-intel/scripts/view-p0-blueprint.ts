#!/usr/bin/env tsx
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

console.log("\n" + "=".repeat(100));
console.log("🔥 本次新抓取的P0机会完整Blueprint");
console.log("=".repeat(100) + "\n");

// 查看最新的两个P0机会
const newP0Opportunities = db
  .prepare("SELECT id, title, target_niche, score, priority, blueprint, pain_point_analysis FROM opportunities WHERE priority = 'P0' ORDER BY id DESC LIMIT 2")
  .all() as any[];

newP0Opportunities.forEach((opp, idx) => {
  console.log(`\n${"━".repeat(100)}`);
  console.log(`【P0机会 ${idx + 1}】${opp.title}`);
  console.log(`评分: ${opp.score} | 目标: ${opp.target_niche}`);
  console.log(`${"━".repeat(100)}`);
  console.log("\n💡 痛点分析:");
  console.log(opp.pain_point_analysis);
  
  if (opp.blueprint && opp.blueprint.length > 100) {
    console.log("\n📋 完整Blueprint:");
    console.log(opp.blueprint);
  }
});

console.log("\n" + "=".repeat(100));
