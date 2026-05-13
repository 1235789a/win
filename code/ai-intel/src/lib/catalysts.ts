// Phase C: 技术/政策催化剂 —— "为什么现在做" 的关键信号
//
// 设计：手工 + 自动维护的一张表。seed 初始数据来自 seed_catalysts()，
// 上线后可以靠 harvester 抓 HN/TechCrunch 自动补充（P2 再做）。

import Database from "better-sqlite3";
import { getRawDB } from "./db";

function getDB(): Database.Database {
  return getRawDB();
}

export type CatalystCategory =
  | "model_release"
  | "platform_change"
  | "regulation"
  | "pricing"
  | "infra"
  | "trend";

export interface Catalyst {
  id: number;
  name: string;
  category: CatalystCategory;
  happened_at: string;         // ISO
  description: string;
  affected_keywords: string;   // "LLM,AI代理,爬虫"
  weight: number;              // 0-1
  enabled: number;
  created_at: string;
}

export interface CatalystMatch {
  id: number;
  name: string;
  category: string;
  happened_at: string;
  weight: number;
  matched_keywords: string[];
  days_ago: number;
}

export function listCatalysts(opts?: { enabledOnly?: boolean }): Catalyst[] {
  const sql = opts?.enabledOnly
    ? "SELECT * FROM tech_catalysts WHERE enabled = 1 ORDER BY happened_at DESC"
    : "SELECT * FROM tech_catalysts ORDER BY happened_at DESC";
  return getDB().prepare(sql).all() as Catalyst[];
}

export function addCatalyst(c: Omit<Catalyst, "id" | "created_at">): number {
  return Number(
    getDB()
      .prepare(
        `INSERT INTO tech_catalysts
          (name, category, happened_at, description, affected_keywords, weight, enabled)
         VALUES (@name, @category, @happened_at, @description, @affected_keywords, @weight, @enabled)`
      )
      .run(c).lastInsertRowid
  );
}

export function disableCatalyst(id: number) {
  getDB().prepare("UPDATE tech_catalysts SET enabled = 0 WHERE id = ?").run(id);
}

/** 匹配：给一段文本（title + niche + tags），返回命中的催化剂列表 */
export function matchCatalysts(opts: {
  text: string;
  withinDays?: number;
}): CatalystMatch[] {
  const text = opts.text.toLowerCase();
  const cutoff = opts.withinDays
    ? new Date(Date.now() - opts.withinDays * 86400_000).toISOString()
    : "0000-01-01";

  const rows = getDB()
    .prepare(
      "SELECT * FROM tech_catalysts WHERE enabled = 1 AND happened_at >= ? ORDER BY happened_at DESC"
    )
    .all(cutoff) as Catalyst[];

  const hits: CatalystMatch[] = [];
  for (const r of rows) {
    const keywords = r.affected_keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const matched = keywords.filter((k) => text.includes(k));
    if (matched.length > 0) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(r.happened_at).getTime()) / 86400_000
      );
      hits.push({
        id: r.id,
        name: r.name,
        category: r.category,
        happened_at: r.happened_at,
        weight: r.weight,
        matched_keywords: matched,
        days_ago: daysAgo,
      });
    }
  }
  return hits;
}

/** 初始种子：2026 年 5 月前后的真实已发生催化剂 */
export function seedCatalysts(force = false): number {
  const db = getDB();
  if (!force) {
    const existing = (db.prepare("SELECT COUNT(*) as c FROM tech_catalysts").get() as any).c;
    if (existing > 0) return 0;
  }

  const seed: Omit<Catalyst, "id" | "created_at">[] = [
    {
      name: "Claude Opus 4.7 发布",
      category: "model_release",
      happened_at: "2026-04-16",
      description: "Anthropic 发布 Opus 4.7，SWE-bench Verified 87.6%，Agent 编程跨越式提升",
      affected_keywords: "AI代理,agent,coding agent,编程,code review,代码审查,软件工程,autonomous",
      weight: 1.0,
      enabled: 1,
    },
    {
      name: "DeepSeek V4 开源",
      category: "model_release",
      happened_at: "2026-04-24",
      description: "DeepSeek V4 Pro/Flash 开源，1M 上下文，$0.14/1M token",
      affected_keywords: "LLM,开源,本地部署,self-host,推理,reasoning,中文,AI 编程",
      weight: 0.85,
      enabled: 1,
    },
    {
      name: "Claude Code Desktop 重构",
      category: "platform_change",
      happened_at: "2026-04-20",
      description: "Anthropic 发布新 Claude Code Desktop，原生支持 MCP / sub-agents",
      affected_keywords: "MCP,sub-agent,code desktop,IDE,开发者工具,CLI",
      weight: 0.7,
      enabled: 1,
    },
    {
      name: "OpenAI Codex 回归",
      category: "model_release",
      happened_at: "2026-04-10",
      description: "OpenAI 重新发布 Codex for Everything，覆盖全栈编程场景",
      affected_keywords: "codex,code generation,代码生成,编程助手,pair programming",
      weight: 0.75,
      enabled: 1,
    },
    {
      name: "Reddit API 正式商业化",
      category: "pricing",
      happened_at: "2025-07-01",
      description: "Reddit 关闭免费 API 层，所有商用必须付费，催生替代方案需求",
      affected_keywords: "reddit,爬虫,scraping,社交数据,community,内容审核",
      weight: 0.6,
      enabled: 1,
    },
    {
      name: "Twitter/X API v3 限流",
      category: "pricing",
      happened_at: "2025-11-15",
      description: "X 把 API 月费提到 $5000，独立开发者转向 nitter / 镜像方案",
      affected_keywords: "twitter,x.com,社交,爬虫,内容监测,trend",
      weight: 0.65,
      enabled: 1,
    },
    {
      name: "Cursor + Claude 4 融合",
      category: "platform_change",
      happened_at: "2026-03-05",
      description: "Cursor 默认集成 Claude 4，独立 IDE 的竞争窗口关闭",
      affected_keywords: "IDE,VSCode,编辑器,编程工具,AI coding",
      weight: 0.55,
      enabled: 1,
    },
    {
      name: "Upwork AI 提案过滤上线",
      category: "platform_change",
      happened_at: "2026-02-10",
      description: "Upwork 官方上线基础 AI 筛选，但效果差，催生第三方工具窗口",
      affected_keywords: "upwork,freelance,proposal,招聘,筛简历",
      weight: 0.5,
      enabled: 1,
    },
    {
      name: "Shopify AI 代理商店上线",
      category: "platform_change",
      happened_at: "2026-03-20",
      description: "Shopify 发布 AI Agent Store，电商 AI 代理生态启动",
      affected_keywords: "shopify,电商,dtc,独立站,AI agent,电商自动化",
      weight: 0.6,
      enabled: 1,
    },
    {
      name: "欧盟 AI Act 全面生效",
      category: "regulation",
      happened_at: "2025-08-02",
      description: "欧盟 AI Act 通用模型义务部分开始执行，需要合规工具",
      affected_keywords: "合规,compliance,AI 监管,GDPR,审计",
      weight: 0.45,
      enabled: 1,
    },
    {
      name: "GitHub Copilot Workspace GA",
      category: "platform_change",
      happened_at: "2026-01-15",
      description: "GitHub Copilot Workspace 正式商用，从补全升级到 PR 级",
      affected_keywords: "github,copilot,PR,code review,软件工程",
      weight: 0.55,
      enabled: 1,
    },
    {
      name: "TanStack NPM 供应链事件",
      category: "trend",
      happened_at: "2026-05-05",
      description: "TanStack 官方包被投毒，重燃 NPM 供应链安全关注度",
      affected_keywords: "npm,供应链,supply-chain,依赖,安全,扫描",
      weight: 0.8,
      enabled: 1,
    },
  ];

  const tx = db.transaction((rows: Omit<Catalyst, "id" | "created_at">[]) => {
    let n = 0;
    for (const r of rows) {
      addCatalyst(r);
      n++;
    }
    return n;
  });
  return tx(seed);
}
