#!/usr/bin/env tsx
import { getDB } from "../src/lib/db";

console.log("\n" + "=".repeat(100));
console.log("🔍 查看最新 P0 机会的完整 Blueprint 内容");
console.log("=".repeat(100) + "\n");

const db = getDB();
const topOpportunities = db
  .prepare("SELECT id, title, target_niche, score, priority, blueprint FROM opportunities WHERE priority = 'P0' ORDER BY id DESC LIMIT 3")
  .all() as any[];

console.log(`✅ 找到 ${topOpportunities.length} 个 P0 机会\n`);

topOpportunities.forEach((opp, idx) => {
  console.log(`\n${"━".repeat(100)}`);
  console.log(`【机会 ${idx + 1}】`);
  console.log(`标题：${opp.title}`);
  console.log(`目标：${opp.target_niche}`);
  console.log(`评分：${opp.score}`);
  console.log(`${"━".repeat(100)}`);

  if (opp.blueprint && opp.blueprint.length > 100) {
    console.log("\n📄 Blueprint 内容（前 2000 字符）：\n");
    console.log(opp.blueprint.slice(0, 2000) + "\n...\n");
  } else {
    console.log("❌ Blueprint 为空或太短！\n");
  }
});

console.log("\n" + "=".repeat(100));
