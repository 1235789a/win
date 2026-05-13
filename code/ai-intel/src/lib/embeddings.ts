// 薄壳：复用 @mi/ai-core 的 embed 能力 + 统一配置入口
// 对一条 opportunity，我们 embed 的是 "title + niche + pain_point_analysis 前 400 字"
// 不 embed 整篇 blueprint（太长 + 内容是我们生成的，相似度反而偏高）

import { embed as coreEmbed, cosineSimilarity } from "@mi/ai-core";
import type { Opportunity } from "./types";

/** 把一条机会组装成用于 embedding 的文本 */
export function textForEmbedding(o: Pick<Opportunity, "title" | "target_niche" | "pain_point_analysis" | "tags">): string {
  const pain = (o.pain_point_analysis || "").slice(0, 400);
  const tags = (o.tags || "").split(",").map((t) => t.trim()).filter(Boolean).join(" ");
  return [
    `Title: ${o.title}`,
    `Niche: ${o.target_niche}`,
    `Tags: ${tags}`,
    `Pain: ${pain}`,
  ].join("\n");
}

export async function embedTexts(texts: string[]): Promise<{ embeddings: Float32Array[]; model: string; cost_usd: number }> {
  const r = await coreEmbed({ texts });
  return {
    embeddings: r.embeddings.map((v) => Float32Array.from(v)),
    model: r.model,
    cost_usd: r.cost_usd,
  };
}

export async function embedOpportunity(o: Opportunity): Promise<{ embedding: Float32Array; model: string; cost_usd: number }> {
  const text = textForEmbedding(o);
  const { embeddings, model, cost_usd } = await embedTexts([text]);
  return { embedding: embeddings[0], model, cost_usd };
}

export { cosineSimilarity };
