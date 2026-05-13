// Phase A 回填脚本：给库里所有还没 embedding 的 opportunities 算 embedding + 分 cluster
// 用法： npx tsx scripts/backfill_clusters.ts
//
// 读 .env.local（注意：dotenv/config 默认读 .env，要显式指定路径）
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv(); // 再合并 .env 兜底

import { listOpportunities, getEmbedding } from "../src/lib/db";
import { assignClusterForOpportunity } from "../src/lib/clustering";

async function main() {
  const all = listOpportunities({ limit: 10000 });
  console.log(`找到 ${all.length} 条 opportunities`);

  let assigned = 0;
  let merged = 0;
  let created = 0;
  let errors = 0;
  let totalCost = 0;

  for (const o of all) {
    const exists = getEmbedding(o.id);
    if (exists && exists.cluster_id) {
      console.log(`  #${o.id} 已有 cluster #${exists.cluster_id}，跳过`);
      continue;
    }
    try {
      const r = await assignClusterForOpportunity(o.id);
      if (r) {
        assigned++;
        if (r.action === "merged") merged++;
        if (r.action === "created") created++;
        totalCost += r.cost_usd;
        console.log(
          `  #${o.id} score=${o.score} → cluster #${r.cluster_id} (${r.action}, sim=${r.max_similarity.toFixed(3)}) | ${o.title.slice(0, 40)}`
        );
      } else {
        errors++;
        console.warn(`  #${o.id} failed to embed`);
      }
      await new Promise((r) => setTimeout(r, 250));
    } catch (err: any) {
      errors++;
      console.error(`  #${o.id} error:`, err?.message || err);
    }
  }

  console.log("");
  console.log(`✅ done`);
  console.log(`   assigned = ${assigned}  (merged ${merged} / created ${created})`);
  console.log(`   errors   = ${errors}`);
  console.log(`   cost     = $${totalCost.toFixed(6)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
