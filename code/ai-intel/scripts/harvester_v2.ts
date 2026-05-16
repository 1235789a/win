// Harvester V2：多源 + 两步管线 + 聚类 + 成本控制
//
// 用法： npx tsx scripts/harvester_v2.ts
//
// 环境变量：
//   MAX_ITEMS=30         最多分析多少条
//   CONCURRENCY=2        并发分析数
//   SKIP_BLUEPRINT=0     是否跳过 blueprint 生成（纯评分模式，最省钱）
//   SOURCES=hn,reddit,upwork   启用哪些源（逗号分隔）

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import {
  HackerNewsSource, RedditSource, UpworkRSSSource,
  GitHubTrendingSource, ProductHuntSource, BlackHatWorldSource,
  V2EXSource, IndieHackersSource, DevToSource, NitterSource,
  GoogleTrendsSource,
} from "../src/lib/sources";
import type { RawItem, SourceAdapter } from "../src/lib/sources";
import { twoStepAnalyze } from "../src/lib/two-step-analyze";
import { insertOpportunity } from "../src/lib/db";
import { assignClusterForOpportunity } from "../src/lib/clustering";
import { recordMention } from "../src/lib/trends";
import type { Opportunity } from "../src/lib/types";

const MAX_ITEMS = Number(process.env.MAX_ITEMS ?? 30);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 2);
const SKIP_BLUEPRINT = process.env.SKIP_BLUEPRINT === "1";
const SOURCES_STR = process.env.SOURCES ?? "hn,reddit,upwork,github,producthunt,bhw,v2ex,indiehackers,devto,twitter,trends";

const t0 = Date.now();

// ─── 初始化数据源 ───
function getSources(): SourceAdapter[] {
  const enabled = SOURCES_STR.split(",").map((s) => s.trim().toLowerCase());
  const sources: SourceAdapter[] = [];
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

// ─── 去重（跨源合并） ───
function dedup(items: RawItem[]): RawItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    // 用 text 前 100 字做简易指纹（避免不同 URL 但同一内容）
    const fp = item.text.slice(0, 100).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(fp)) return false;
    if (seen.has(item.id)) return false;
    seen.add(fp);
    seen.add(item.id);
    return true;
  });
}

// ─── 并发控制 ───
async function poolRun<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ─── 主流程 ───
async function main() {
  const sources = getSources();
  console.log(`\n🚀 harvester_v2`);
  console.log(`  sources=${sources.map((s) => s.name).join(",")}`);
  console.log(`  max_items=${MAX_ITEMS}  concurrency=${CONCURRENCY}  skip_blueprint=${SKIP_BLUEPRINT}`);
  console.log("");

  // Step 1: 抓取
  console.log("[1/3] harvesting...");
  const allItems: RawItem[] = [];
  for (const src of sources) {
    try {
      const items = await src.harvest({ limit: Math.ceil(MAX_ITEMS / sources.length), maxAgeHours: 48 });
      console.log(`  [${src.name}] ${items.length} items`);
      allItems.push(...items);
    } catch (err: any) {
      console.warn(`  [${src.name}] error: ${err?.message}`);
    }
  }

  const unique = dedup(allItems);
  const toAnalyze = unique.slice(0, MAX_ITEMS);
  console.log(`  total=${allItems.length} unique=${unique.length} analyzing=${toAnalyze.length}\n`);

  // Step 2: 两步分析
  console.log("[2/3] analyzing (two-step pipeline)...\n");
  let okCount = 0;
  let errCount = 0;
  let totalCost = 0;
  let p0 = 0, p1 = 0;

  await poolRun(toAnalyze, CONCURRENCY, async (item, idx) => {
    const label = `[${String(idx + 1).padStart(3)}/${toAnalyze.length}]`;
    const t1 = Date.now();
    try {
      const r = await twoStepAnalyze(item.platform, item.text, {
        skipBlueprint: SKIP_BLUEPRINT,
      });
      const ms = ((Date.now() - t1) / 1000).toFixed(1);
      totalCost += r.usage.cost_usd;

      if (r.score < 40) {
        // 太低分不存库，省空间
        console.log(`${label} skip s=${r.score.toString().padStart(3)} ${ms}s | ${item.text.slice(0, 50)}`);
        okCount++;
        return;
      }

      // 存库
      const saved_id = insertOpportunity({
        source_platform: item.platform as any,
        source_url: item.url,
        raw_text: item.text,
        title: r.title,
        target_niche: r.target_niche,
        pain_point_analysis: r.pain_point_analysis,
        build_once_sell_infinite: r.build_once_sell_infinite ? 1 : 0,
        score: r.score,
        priority: r.priority as any,
        tags: r.tags.join(","),
        blueprint: r.blueprint,
        has_blueprint: r.blueprint.length > 200 ? 1 : 0,
        analysis_json: JSON.stringify(r),
        tokens_in: r.usage.tokens_in,
        tokens_out: r.usage.tokens_out,
        cost_usd: r.usage.cost_usd,
        favorite: 0,
      } satisfies Omit<Opportunity, "id" | "created_at">);

      // 聚类（fire-and-forget 级别，失败不影响）
      let clusterId: number | null = null;
      try {
        const cr = await assignClusterForOpportunity(saved_id);
        clusterId = cr?.cluster_id ?? null;
      } catch { /* silent */ }

      // Phase C: 写 mention（趋势原料）
      try {
        recordMention({
          cluster_id: clusterId,
          opportunity_id: saved_id,
          source_platform: item.platform,
          mentioned_at: item.published_at ?? new Date().toISOString(),
          engagement: item.engagement ?? 0,
          text_sample: item.text.slice(0, 200),
        });
      } catch { /* silent */ }

      if (r.priority === "P0") p0++;
      if (r.priority === "P1") p1++;

      const icon = r.priority === "P0" ? "🔥" : r.priority === "P1" ? "📈" : "  ";
      console.log(
        `${label} ${icon} ${r.priority} s=${r.score.toString().padStart(3)} ${ms}s $${r.usage.cost_usd.toFixed(4)} | ${r.title.slice(0, 35)}`
      );
      okCount++;
    } catch (err: any) {
      const ms = ((Date.now() - t1) / 1000).toFixed(1);
      errCount++;
      console.log(`${label} ❌ ${ms}s | ${(err?.message ?? "").slice(0, 60)} | ${item.text.slice(0, 40)}`);
    }
  });

  // 结果
  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n✅ done in ${elapsed}min`);
  console.log(`   analyzed ok = ${okCount}`);
  console.log(`   analyzed err= ${errCount}`);
  console.log(`   P0/P1       = ${p0} / ${p1}`);
  console.log(`   💰 total cost= $${totalCost.toFixed(4)}`);
  console.log(`\n下一步：`);
  console.log(`  curl http://localhost:3000/api/clusters`);
  console.log(`  curl http://localhost:3000/api/opportunities`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
