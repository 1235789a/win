#!/usr/bin/env tsx
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import {
  HackerNewsSource,
  GitHubTrendingSource,
  ProductHuntSource,
  DevToSource,
  type RawItem,
} from "../src/lib/sources";
import { twoStepAnalyze } from "../src/lib/two-step-analyze";
import { insertOpportunity } from "../src/lib/db";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db: Database.Database | null = null;
function getDBDirect(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

// 检查 URL 是否已存在于数据库
function isUrlExists(url: string): boolean {
  if (!url) return false;
  const db = getDBDirect();
  const row = db.prepare("SELECT 1 as cnt FROM opportunities WHERE source_url = ?").get(url) as { cnt: number } | undefined;
  return !!row?.cnt;
}

// 检查文本是否已存在（前 500 字符哈希去重）
function isTextExists(text: string): boolean {
  const preview = text.slice(0, 500).toLowerCase().replace(/\s+/g, " ").trim();
  const db = getDBDirect();
  const row = db.prepare("SELECT 1 as cnt FROM opportunities WHERE raw_text LIKE ?").get(`%${preview}%`) as { cnt: number } | undefined;
  return !!row?.cnt;
}

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 100条增强版抓取（含去重）");
  console.log("=".repeat(80) + "\n");

  const MAX_ITEMS = 100;
  const CONCURRENCY = 4;
  const sources = [
    new HackerNewsSource(),
    new GitHubTrendingSource(),
    new ProductHuntSource(),
    new DevToSource(),
  ];

  // 第一步：抓取所有源
  console.log("[1/3] 从各源抓取数据...");
  const allItems: RawItem[] = [];
  for (const src of sources) {
    try {
      const items = await src.harvest({ limit: 30 }); // 每个源抓30条，然后去重
      console.log(`  ✅ [${src.name}] ${items.length} 条`);
      allItems.push(...items);
    } catch (e) {
      console.error(`  ❌ [${src.name}] ${e}`);
    }
  }
  console.log(`  总抓取 ${allItems.length} 条`);

  // 第二步：去重
  console.log("\n[2/3] 去重（基于 URL 和文本相似性）...");
  const uniqueItems: RawItem[] = [];
  const seenUrls = new Set<string>();
  const seenTextHashes = new Set<string>();
  let skippedDuplicate = 0;
  let skippedInDb = 0;

  for (const item of allItems) {
    const textHash = item.text.slice(0, 400).toLowerCase().replace(/\s+/g, " ").trim();
    const urlKey = item.url || "";

    // 1. URL 去重
    if (urlKey && seenUrls.has(urlKey)) {
      skippedDuplicate++;
      continue;
    }
    // 2. 文本哈希去重
    if (seenTextHashes.has(textHash)) {
      skippedDuplicate++;
      continue;
    }
    // 3. 数据库已存在去重
    if (urlKey && isUrlExists(urlKey)) {
      skippedInDb++;
      continue;
    }
    if (isTextExists(item.text)) {
      skippedInDb++;
      continue;
    }

    seenUrls.add(urlKey);
    seenTextHashes.add(textHash);
    uniqueItems.push(item);
  }

  console.log(`  去重后：${uniqueItems.length} 条`);
  console.log(`  - 跳过重复：${skippedDuplicate}`);
  console.log(`  - 跳过已在库：${skippedInDb}`);

  // 取前 100 条分析
  const toAnalyze = uniqueItems.slice(0, MAX_ITEMS);
  console.log(`\n[3/3] 分析 ${toAnalyze.length} 条...`);

  let okCount = 0;
  let errCount = 0;
  let totalCost = 0;
  let p0Count = 0, p1Count = 0;

  for (let i = 0; i < toAnalyze.length; i += CONCURRENCY) {
    const batch = toAnalyze.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (item, idx) => {
        const globalIdx = i + idx;
        const t1 = Date.now();
        try {
          const r = await twoStepAnalyze(item.platform, item.text, {});
          const ms = ((Date.now() - t1) / 1000).toFixed(1);
          totalCost += r.usage.cost_usd;

          if (r.score < 35) {
            return { ok: false, skip: true, score: r.score, idx: globalIdx };
          }

          // 保存
          insertOpportunity({
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
          });

          if (r.priority === "P0") p0Count++;
          if (r.priority === "P1") p1Count++;

          const icon = r.priority === "P0" ? "🔥" : r.priority === "P1" ? "📈" : "  ";
          console.log(`  [${String(globalIdx + 1).padStart(3)}/${toAnalyze.length}] ${icon} ${r.priority} s=${r.score.toString().padStart(3)} ${ms}s | ${r.title.slice(0, 45)}`);
          return { ok: true, priority: r.priority, score: r.score };
        } catch (err) {
          const ms = ((Date.now() - t1) / 1000).toFixed(1);
          console.error(`  [${String(globalIdx + 1).padStart(3)}/${toAnalyze.length}] ❌ ${ms}s | ${(err as Error)?.message?.slice(0, 40)}`);
          return { ok: false, error: err };
        }
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.ok) okCount++;
        else if (!result.value.skip) errCount++;
      } else {
        errCount++;
      }
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ 完成！");
  console.log(`  分析成功：${okCount}`);
  console.log(`  分析失败：${errCount}`);
  console.log(`  P0 机会：${p0Count}`);
  console.log(`  P1 机会：${p1Count}`);
  console.log(`  总成本：$${totalCost.toFixed(4)}`);
  console.log("=".repeat(80) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
