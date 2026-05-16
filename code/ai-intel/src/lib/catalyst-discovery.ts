// 催化剂自动发现：从高分机会的帖子里提取"为什么现在火"的事件
// 用 LLM 一句话总结催化剂 → 写入 tech_catalysts 表
//
// 触发时机：harvester 跑完后对所有新增 P0 机会调一次
// 成本：每条 ~200 token out，$0.0001

import { askJSON } from "@/lib/ai";
import { addCatalyst, listCatalysts, type CatalystCategory } from "./catalysts";
import { getRawDB } from "./db";

const EXTRACT_SYSTEM = `你是一名技术趋势分析师。从一段文本中提取"为什么这个需求现在突然火了"的催化事件。

输出严格 JSON，不带围栏：
{
  "has_catalyst": true/false,
  "name": "事件名（10-25字，如'Claude Opus 4.7 发布'/'Reddit API 涨价'）",
  "category": "model_release" | "platform_change" | "regulation" | "pricing" | "infra" | "trend",
  "happened_at": "YYYY-MM-DD（大致日期）",
  "affected_keywords": "逗号分隔的关键词（3-6个，用于匹配其他机会）",
  "description": "一句话描述（30-50字）"
}

如果文本里没有明确的催化事件（只是一个老痛点），输出 {"has_catalyst": false}。
不要编造事件。只提取文本里明确提到的已发生事件。`;

const EXTRACT_USER = (title: string, text: string) =>
  `产品/机会：${title}\n原文：\n"""\n${text.slice(0, 1000)}\n"""`;

interface DiscoveredCatalyst {
  name: string;
  category: CatalystCategory;
  happened_at: string;
  description: string;
  affected_keywords: string;
}

/**
 * 从一条高分机会的原文里尝试提取催化剂
 * 返回 null 表示没发现新催化剂
 */
export async function discoverCatalyst(
  title: string,
  rawText: string
): Promise<DiscoveredCatalyst | null> {
  try {
    const r = await askJSON<{
      has_catalyst?: boolean;
      name?: string;
      category?: string;
      happened_at?: string;
      affected_keywords?: string;
      description?: string;
    }>({
      system: EXTRACT_SYSTEM,
      user: EXTRACT_USER(title, rawText),
      maxTokens: 512,
      temperature: 0.1,
    });

    if (!r.data.has_catalyst || !r.data.name) return null;

    return {
      name: (r.data.name ?? "").slice(0, 50),
      category: (r.data.category as CatalystCategory) ?? "trend",
      happened_at: r.data.happened_at ?? new Date().toISOString().slice(0, 10),
      description: (r.data.description ?? "").slice(0, 100),
      affected_keywords: (r.data.affected_keywords ?? "").slice(0, 200),
    };
  } catch {
    return null;
  }
}

/**
 * 对一批新增 P0 机会批量提取催化剂并写入 DB
 * 自动去重：如果已有同名催化剂则跳过
 */
export async function batchDiscoverCatalysts(
  opportunities: { id: number; title: string; raw_text: string }[]
): Promise<{ discovered: number; duplicates: number }> {
  const existing = new Set(listCatalysts().map((c) => c.name.toLowerCase()));
  let discovered = 0;
  let duplicates = 0;

  for (const opp of opportunities) {
    const catalyst = await discoverCatalyst(opp.title, opp.raw_text);
    if (!catalyst) continue;

    // 去重
    if (existing.has(catalyst.name.toLowerCase())) {
      duplicates++;
      continue;
    }

    addCatalyst({
      name: catalyst.name,
      category: catalyst.category,
      happened_at: catalyst.happened_at,
      description: catalyst.description,
      affected_keywords: catalyst.affected_keywords,
      weight: 0.6, // 自动发现的给 0.6 权重（低于手动的 1.0）
      enabled: 1,
    });
    existing.add(catalyst.name.toLowerCase());
    discovered++;

    // 限速
    await new Promise((r) => setTimeout(r, 300));
  }

  return { discovered, duplicates };
}
