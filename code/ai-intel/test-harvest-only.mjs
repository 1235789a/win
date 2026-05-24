#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

console.log("\n" + "=".repeat(70));
console.log("🚀 运行完整数据源抓取测试（无 AI 分析）");
console.log("=".repeat(70) + "\n");

// 导入数据源
const {
  HackerNewsSource,
  RedditSource,
  UpworkRSSSource,
  GitHubTrendingSource,
  ProductHuntSource,
  BlackHatWorldSource,
  V2EXSource,
  IndieHackersSource,
  DevToSource,
  NitterSource,
  GoogleTrendsSource,
} = await import("./src/lib/sources/index.ts");

const t0 = Date.now();
const enabledSources = "hn,github,producthunt,devto,upwork,trends";
console.log(`启用源: ${enabledSources}`);

function getSources() {
  const enabled = enabledSources.split(",").map(s => s.trim().toLowerCase());
  const sources = [];
  if (enabled.includes("hn")) sources.push(new HackerNewsSource());
  if (enabled.includes("reddit")) sources.push(new RedditSource());
  if (enabled.includes("upwork")) sources.push(new UpworkRSSSource());
  if (enabled.includes("github")) sources.push(new GitHubTrendingSource());
  if (enabled.includes("producthunt")) sources.push(new ProductHuntSource());
  if (enabled.includes("bhw")) sources.push(new BlackHatWorldSource());
  if (enabled.includes("v2ex")) sources.push(new V2EXSource());
  if (enabled.includes("indiehackers")) sources.push(new IndieHackersSource());
  if (enabled.includes("devto")) sources.push(new DevToSource());
  if (enabled.includes("twitter")) sources.push(new NitterSource());
  if (enabled.includes("trends")) sources.push(new GoogleTrendsSource());
  return sources;
}

const sources = getSources();
console.log(`初始化 ${sources.length} 个数据源`);
console.log("");

// Step 1: 抓取
console.log("[1/1] harvesting...");
const allItems = [];
for (const src of sources) {
  try {
    const items = await src.harvest({ limit: 10 });
    console.log(`  ✅ [${src.name}] ${items.length} items`);
    allItems.push(...items);
  } catch (err) {
    console.error(`  ❌ [${src.name}] error: ${err?.message}`);
  }
}

console.log("");
console.log("=".repeat(70));
console.log(`✅ 完成！共获取 ${allItems.length} 条数据`);
console.log("=".repeat(70) + "\n");

// 显示每个源的数据样本
const grouped = {};
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
