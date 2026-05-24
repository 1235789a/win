#!/usr/bin/env tsx
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import {
  HackerNewsSource,
  UpworkRSSSource,
  GitHubTrendingSource,
  ProductHuntSource,
  DevToSource,
  GoogleTrendsSource,
} from "./src/lib/sources";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 运行完整数据源抓取测试");
  console.log("=".repeat(70) + "\n");

  const t0 = Date.now();
  const sources = [
    new HackerNewsSource(),
    new GitHubTrendingSource(),
    new ProductHuntSource(),
    new DevToSource(),
    new UpworkRSSSource(),
    new GoogleTrendsSource(),
  ];

  console.log(`初始化 ${sources.length} 个数据源`);
  console.log("");

  // Step 1: 抓取
  console.log("[1/1] harvesting...");
  const allItems: any[] = [];
  for (const src of sources) {
    try {
      const items = await src.harvest({ limit: 10 });
      console.log(`  ✅ [${src.name}] ${items.length} items`);
      allItems.push(...items);
    } catch (err: any) {
      console.error(`  ❌ [${src.name}] error: ${err?.message}`);
    }
  }

  console.log("");
  console.log("=".repeat(70));
  console.log(`✅ 完成！共获取 ${allItems.length} 条数据`);
  console.log("=".repeat(70) + "\n");

  // 显示每个源的数据样本
  const grouped: Record<string, any[]> = {};
  allItems.forEach(item => {
    if (!grouped[item.platform]) grouped[item.platform] = [];
    grouped[item.platform].push(item);
  });

  for (const [platform, items] of Object.entries(grouped)) {
    console.log(`📌 ${platform} (${items.length} 条):`);
    items.slice(0, 3).forEach(item => {
      const titlePreview = item.text.slice(0, 60).replace(/\n/g, " ");
      console.log(`   • ${titlePreview}...`);
    });
    if (items.length > 3) {
      console.log(`   ... and ${items.length - 3} more`);
    }
    console.log("");
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`⏱️  耗时: ${elapsed} 秒\n`);

  console.log("💡 提示: 要运行完整的 AI 分析，请配置 Gemini/OpenAI API Key");
  console.log("   然后运行: npx tsx scripts/harvester_v2.ts\n");
}

main().catch(console.error);
