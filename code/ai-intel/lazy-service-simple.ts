#!/usr/bin/env tsx
/**
 * 懒人服务挖掘器 - 简化版
 * 
 * 策略：把开源工具翻译成懒人服务
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 定义哪些GitHub项目最适合做懒人服务
const LAZY_SERVICE_PATTERNS = [
  "cli", "command", "terminal", "bash", "shell", "script",
  "scraper", "crawler", "parser", "converter", "transform", "extractor",
  "video", "audio", "image", "media", "ffmpeg", "thumbnail",
  "inference", "model", "training", "ml", "ai",
  "automation", "workflow", "pipeline", "ci/cd", "bot",
  "api", "server", "proxy", "gateway",
  "scan", "security", "vulnerability", "detect", "monitor",
  "database", "db", "sql", "mongodb", "postgres", "redis",
  "pdf", "document", "excel", "csv", "json", "xml",
  "email", "sms", "notification", "webhook",
];

function initDB() {
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
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
  return database;
}

async function harvestGitHub() {
  console.log("\n🚀 懒人服务挖掘器 - 把开源工具翻译成懒人服务\n");
  console.log("策略：寻找GitHub上的开源CLI工具，包装成Web服务\n");
  
  const db = initDB();
  
  // 直接从GitHub Trending API抓取
  const response = await fetch("https://api.github.com/search/repositories?q=stars:>100+created:>2024-01-01&sort=stars&order=desc&per_page=50", {
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "AI-Intel-Harvester"
    }
  });
  
  const data = await response.json();
  const repos = data.items || [];
  
  console.log(`[1/2] 从GitHub抓取 ${repos.length} 个高星项目...`);
  
  // 筛选适合做懒人服务的
  const lazyRepos = repos.filter((repo: any) => {
    const text = `${repo.name} ${repo.description || ""} ${repo.topics?.join(' ') || ''}`.toLowerCase();
    return LAZY_SERVICE_PATTERNS.some(p => text.includes(p));
  });
  
  console.log(`  筛选出 ${lazyRepos.length} 个适合做懒人服务的项目\n`);
  
  if (lazyRepos.length === 0) {
    console.log("没有找到合适的懒人服务机会\n");
    return;
  }
  
  // 去重
  const existing = db.prepare("SELECT source_url FROM opportunities").all().map((r: any) => r.source_url);
  const uniqueRepos = lazyRepos.filter((repo: any) => !existing.includes(repo.html_url));
  
  console.log(`[2/2] 去重后 ${uniqueRepos.length} 个新机会\n`);
  
  // 保存结果
  const results = uniqueRepos.slice(0, 20).map((repo: any) => ({
    platform: "github",
    url: repo.html_url,
    title: repo.name,
    description: repo.description || "",
    stars: repo.stargazers_count,
    language: repo.language,
    topics: repo.topics || [],
  }));
  
  console.log("🎯 最适合做懒人服务的GitHub开源项目：\n");
  
  results.forEach((repo, i) => {
    console.log(`${i + 1}. ${repo.title} ⭐${repo.stars}`);
    console.log(`   ${repo.url}`);
    console.log(`   ${repo.description}`);
    console.log(`   语言: ${repo.language || 'N/A'} | 标签: ${repo.topics.slice(0, 3).join(', ')}`);
    console.log("");
  });
  
  // 保存到文件
  const outputFile = "./lazy-service-opportunities.json";
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf8");
  console.log(`✓ 已保存到 ${outputFile}`);
  
  // 插入数据库
  results.forEach(repo => {
    db.prepare(`
      INSERT INTO opportunities (
        source_platform, source_url, raw_text, title,
        target_niche, pain_point_analysis, build_once_sell_infinite,
        score, priority, tags, blueprint, has_blueprint,
        analysis_json, tokens_in, tokens_out, cost_usd, favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      repo.platform,
      repo.url,
      JSON.stringify(repo),
      repo.title,
      "开发者/普通用户",
      "GitHub开源CLI工具，普通用户不会用，可以包装成懒人服务",
      1,
      Math.min(Math.floor(repo.stars / 100), 85), // 评分基于star数量
      "P0",
      repo.topics.join(','),
      "",
      0,
      JSON.stringify({ lazy_service: true, stars: repo.stars }),
      0, 0, 0, 0
    );
  });
  
  console.log(`\n✓ 已插入 ${results.length} 个机会到数据库`);
  
  db.close();
}

harvestGitHub().catch(err => {
  console.error(err);
  process.exit(1);
});
