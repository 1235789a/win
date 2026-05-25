#!/usr/bin/env tsx
import {
  HackerNewsSource,
  UpworkRSSSource,
  GitHubTrendingSource,
  ProductHuntSource,
  DevToSource,
  GoogleTrendsSource,
} from "./src/lib/sources";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔍 正在抓取真实痛点数据...\n");

  const sources = [
    { name: "HackerNews", Source: HackerNewsSource },
    { name: "ProductHunt", Source: ProductHuntSource },
    { name: "Dev.to", Source: DevToSource },
    { name: "GitHub Trending", Source: GitHubTrendingSource },
    { name: "Upwork/Freelance", Source: UpworkRSSSource },
    { name: "Google Trends", Source: GoogleTrendsSource },
  ];

  const allData = [];

  for (const { name, Source } of sources) {
    console.log(`正在抓取 ${name}...`);
    try {
      const source = new Source();
      const items = await source.harvest({ limit: 10 });
      allData.push({
        source: name,
        items: items.map(item => ({
          text: item.text,
          url: item.url,
          engagement: item.engagement,
        })),
      });
      console.log(`  ✅ 抓到 ${items.length} 条`);
    } catch (e) {
      console.error(`  ❌ 失败: ${e}`);
    }
  }

  // 保存到文件
  const outputPath = path.join(process.cwd(), "data", "captured-pains.json");
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`\n✅ 数据已保存到 ${outputPath}`);

  // 打印预览
  console.log("\n" + "=".repeat(80));
  console.log("🔥 真实痛点数据预览（前20条）");
  console.log("=".repeat(80));

  let count = 0;
  for (const { source, items } of allData) {
    for (const item of items) {
      if (count >= 20) break;
      console.log(`\n【${source}】`);
      console.log(item.text.slice(0, 500));
      if (item.url) {
        console.log(`URL: ${item.url}`);
      }
      count++;
    }
  }
}

main().catch(console.error);
