// Phase C 每日快照脚本：把所有 cluster 的当前趋势指标固化到 trend_snapshots
// 用法：  npx tsx scripts/trend_snapshot.ts [YYYY-MM-DD]
// cron:   0 3 * * * cd /path/ai-intel && npx tsx scripts/trend_snapshot.ts

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { writeTrendSnapshots } from "../src/lib/trends";
import { seedCatalysts, listCatalysts } from "../src/lib/catalysts";

async function main() {
  const date = process.argv[2]; // 可选：补算历史某天

  // 首次跑时顺便 seed 催化剂
  const seeded = seedCatalysts(false);
  if (seeded > 0) {
    console.log(`seeded ${seeded} catalysts`);
  } else {
    const existing = listCatalysts({ enabledOnly: true }).length;
    console.log(`catalysts: ${existing} (already seeded)`);
  }

  const n = writeTrendSnapshots(date);
  console.log(`wrote ${n} trend snapshots for ${date ?? new Date().toISOString().slice(0, 10)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
