#!/usr/bin/env tsx
/**
 * 懒人服务挖掘器
 * 
 * 策略：把开源工具翻译成懒人服务
 * 
 * 筛选标准：
 * 1. 必须是GitHub开源项目
 * 2. 有CLI但没有Web UI，或UI很烂
 * 3. 需要复杂配置或依赖
 * 4. 使用场景明确但门槛高
 * 5. 可以快速自动化
 * 6. 普通用户有直接需求
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.join(process.cwd(), ".env.local") });

import {
  HackerNewsSource,
  GitHubTrendingSource,
  ProductHuntSource,
  DevToSource,
  type RawItem,
} from "./packages/ai-core/src/lib/sources";
import { twoStepAnalyze } from "./packages/ai-core/src/lib/two-step-analyze";
import { insertOpportunity, getDB } from "../src/lib/db";
import Database from "better-sqlite3";
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

function initDB() {
  const database = getDBDirect();
  database.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      source_platform TEXT NOT NULL,
      source_url TEXT,
      raw_text TEXT NOT NULL,
      title TEXT NOT NULL,
      target_niche TEXT NOT NULL,
      pain_point_analysis TEXT NOT NULL,
      build_once_sell_infinite INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL,
      priority TEXT NOT NULL,
      tags TEXT DEFAULT '',
      blueprint TEXT DEFAULT '',
      has_blueprint INTEGER NOT NULL DEFAULT 0,
      analysis_json TEXT NOT NULL,
      tokens_in INTEGER NOT NULL DEFAULT 0,
      tokens_out INTEGER NOT NULL DEFAULT 0,
      cost_usd REAL NOT NULL DEFAULT 0,
      favorite INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_opp_score ON opportunities(score DESC);
    CREATE INDEX IF NOT EXISTS idx_opp_created ON opportunities(created_at DESC);
  `);
}

// 定义哪些GitHub项目最适合做懒人服务
const LAZY_SERVICE_PATTERNS = [
  // CLI工具但没有好UI的
  "cli", "command", "terminal", "bash", "shell", "script",
  
  // 需要复杂配置的
  "config", "setup", "install", "docker", "kubernetes", "deployment",
  
  // 数据处理工具
  "scraper", "crawler", "parser", "converter", "transform", "extractor",
  
  // 媒体处理
  "video", "audio", "image", "media", "ffmpeg", "thumbnail",
  
  // AI/ML工具
  "inference", "model", "training", "ml", "ai", "llm",
  
  // 自动化工具
  "automation", "workflow", "pipeline", "ci/cd", "bot",
  
  // 开发工具
  "api", "server", "proxy", "gateway", "bridge",
  
  // 安全工具
  "scan", "security", "vulnerability", "detect", "monitor",
  
  // 数据工具
  "database", "db", "sql", "mongodb", "postgres", "redis",
  
  // 文件处理
  "pdf", "document", "excel", "csv", "json", "xml",
  
  // 通信工具
  "email", "sms", "notification", "webhook", "telegram", "discord",
];

// 太简单的不要
const TOO_SIMPLE_PATTERNS = [
  "todo", "notes", "markdown", "simple", "basic", "starter",
];

// 已有商业替代的不要
const ALREADY_COMMERCIAL_PATTERNS = [
  "notion", "slack", "zoom", "dropbox", "google docs",
];

function isGoodLazyService(item: RawItem): boolean {
  const text = `${item.title} ${item.description || ""}`.toLowerCase();
  
  // 必须有懒人服务特征
  const hasGoodPattern = LAZY_SERVICE_PATTERNS.some(p => text.includes(p));
  if (!hasGoodPattern) return false;
  
  // 不能太简单
  const hasSimplePattern = TOO_SIMPLE_PATTERNS.some(p => text.includes(p));
  if (hasSimplePattern) return false;
  
  // 不能已有商业替代
  const hasCommercialPattern = ALREADY_COMMERCIAL_PATTERNS.some(p => text.includes(p));
  if (hasCommercialPattern) return false;
  
  return true;
}

async function harvestGitHubTools(limit: number = 50): Promise<RawItem[]> {
  const source = new GitHubTrendingSource();
  const items = await source.harvest({ limit });
  
  // 筛选适合做懒人服务的
  const lazyItems = items.filter(isGoodLazyService);
  
  console.log(`  GitHub抓取 ${items.length} 条，筛选出 ${lazyItems.length} 条适合做懒人服务`);
  
  return lazyItems;
}

async function main() {
  initDB();
  
  console.log("\n" + "=".repeat(80));
  console.log("🚀 懒人服务挖掘器 - 把开源工具翻译成懒人服务");
  console.log("=".repeat(80) + "\n");
  
  console.log("策略：寻找GitHub上的开源CLI工具，包装成Web服务\n");
  
  // 只抓GitHub
  console.log("[1/3] 从GitHub抓取开源工具...");
  const newItems = await harvestGitHubTools(50);
  
  if (newItems.length === 0) {
    console.log("没有找到合适的懒人服务机会\n");
    return;
  }
  
  // 去重
  console.log("\n[2/3] 去重...");
  const database = getDBDirect();
  const existing = database
    .prepare("SELECT source_url FROM opportunities")
    .all()
    .map((r: any) => r.source_url);
  
  const uniqueItems = newItems.filter(item => !existing.includes(item.url));
  console.log(`  去重后：${uniqueItems.length} 条新机会`);
  
  if (uniqueItems.length === 0) {
    console.log("没有新的懒人服务机会\n");
    return;
  }
  
  // 分析（只分析前20个）
  const itemsToAnalyze = uniqueItems.slice(0, 20);
  console.log(`\n[3/3] 分析 ${itemsToAnalyze.length} 个懒人服务机会...`);
  
  let successCount = 0;
  let p0Count = 0;
  let p1Count = 0;
  let totalCost = 0;
  
  for (let i = 0; i < itemsToAnalyze.length; i++) {
    const item = itemsToAnalyze[i];
    process.stdout.write(`  [${i + 1}/${itemsToAnalyze.length}] `);
    
    try {
      const analysis = await twoStepAnalyze(item);
      
      const priority = analysis.priority;
      const score = analysis.score;
      
      insertOpportunity({
        source_platform: item.platform,
        source_url: item.url,
        raw_text: item.rawText || "",
        title: item.title,
        ...analysis,
      });
      
      successCount++;
      if (priority === "P0") p0Count++;
      if (priority === "P1") p1Count++;
      totalCost += analysis.costUsd;
      
      const icon = priority === "P0" ? "🔥" : priority === "P1" ? "📈" : "   ";
      const time = (analysis.costUsd / 0.00001).toFixed(0);
      console.log(`${icon} ${priority} s=${score} ~${time}ms | ${item.title}`);
    } catch (err) {
      console.log(`❌ ${(err as Error).message.slice(0, 50)}`);
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("✅ 完成！");
  console.log(`  懒人服务机会：${successCount} 个`);
  console.log(`  🔥 P0：${p0Count} 个`);
  console.log(`  📈 P1：${p1Count} 个`);
  console.log(`  💰 成本：$${totalCost.toFixed(4)}`);
  console.log("=".repeat(80) + "\n");
  
  // 输出最适合做懒人服务的项目
  const lazyServices = database
    .prepare("SELECT * FROM opportunities WHERE priority IN ('P0', 'P1') ORDER BY score DESC LIMIT 10")
    .all() as any[];
  
  if (lazyServices.length > 0) {
    console.log("\n🎯 最适合做懒人服务的项目：\n");
    lazyServices.forEach((opp: any, i: number) => {
      console.log(`${i + 1}. [${opp.score}分] ${opp.title}`);
      console.log(`   ${opp.source_url}`);
      console.log(`   目标用户: ${opp.target_niche}`);
      console.log();
    });
  }
  
  db?.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
