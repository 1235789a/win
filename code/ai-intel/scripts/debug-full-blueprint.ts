#!/usr/bin/env tsx
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

console.log("\n" + "=".repeat(100));
console.log("🔍 查看完整的 P0 机会 Blueprint 内容");
console.log("=".repeat(100) + "\n");

const topOpportunities = db
  .prepare("SELECT id, title, target_niche, score, priority, blueprint FROM opportunities WHERE priority = 'P0' ORDER BY id DESC LIMIT 1")
  .all() as any[];

topOpportunities.forEach((opp) => {
  console.log(`\n${"━".repeat(100)}`);
  console.log(`【机会】${opp.title}`);
  console.log(`目标：${opp.target_niche}`);
  console.log(`评分：${opp.score}`);
  console.log(`${"━".repeat(100)}`);

  if (opp.blueprint) {
    console.log("\n📄 完整 Blueprint 内容：\n");
    console.log(opp.blueprint);
  } else {
    console.log("❌ Blueprint 为空！\n");
  }
});

console.log("\n" + "=".repeat(100));
