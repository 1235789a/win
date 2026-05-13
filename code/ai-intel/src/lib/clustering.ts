// Phase A：聚类去重 —— 单链接（single-link）在线聚类
//
// 算法：
//   1. 新机会来了 → 算 embedding
//   2. 跟库里所有已有 embedding 算余弦相似度
//   3. if max_sim >= MERGE_THRESHOLD  → 合并到最相似那条所在的 cluster
//      elif max_sim >= RELATE_THRESHOLD → 作为"相关"关联（TODO: 后续 Phase）
//      else → 新建 cluster，单独成员
//
// 阈值基于 Gemini embedding-001 的经验值调整：
//   - 768 维 cosine 在同一痛点附近通常 > 0.88
//   - 完全无关 < 0.60

import { getOpportunity, saveEmbedding, allEmbeddings, createCluster, assignClusterToOpp, recomputeCluster } from "./db";
import { embedOpportunity, cosineSimilarity } from "./embeddings";
import type { Opportunity } from "./types";

export const MERGE_THRESHOLD = Number(process.env.CLUSTER_MERGE_THRESHOLD ?? 0.88);
export const RELATE_THRESHOLD = Number(process.env.CLUSTER_RELATE_THRESHOLD ?? 0.78);

export interface ClusterAssignment {
  opportunity_id: number;
  cluster_id: number;
  action: "merged" | "created";
  max_similarity: number;
  matched_opportunity_id: number | null;
  model: string;
  cost_usd: number;
}

/**
 * 为一条新机会计算 embedding 并分配 cluster。
 * 失败不抛，降级为"不分配 cluster"（让业务继续走）。
 */
export async function assignClusterForOpportunity(
  oppId: number
): Promise<ClusterAssignment | null> {
  const opp = getOpportunity(oppId);
  if (!opp) return null;

  let embedding: Float32Array;
  let model: string;
  let cost_usd: number;
  try {
    const r = await embedOpportunity(opp);
    embedding = r.embedding;
    model = r.model;
    cost_usd = r.cost_usd;
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn(`[clustering] embed failed for opp#${oppId}:`, err?.message || err);
    return null;
  }

  // 存 embedding（cluster_id 先空，分配后再补）
  saveEmbedding(oppId, embedding, model, null);

  // 找最相似的已有 embedding（排除自己）
  const existing = allEmbeddings(oppId);
  let bestSim = -1;
  let bestMatch: { opp_id: number; cluster_id: number | null } | null = null;
  for (const e of existing) {
    if (e.dim !== embedding.length) continue; // 不同模型的 embedding 不比
    const sim = cosineSimilarity(
      Array.from(embedding),
      Array.from(e.embedding)
    );
    if (sim > bestSim) {
      bestSim = sim;
      bestMatch = { opp_id: e.opportunity_id, cluster_id: e.cluster_id };
    }
  }

  let action: "merged" | "created";
  let cluster_id: number;

  if (bestMatch && bestSim >= MERGE_THRESHOLD) {
    // 合并到现有 cluster；如果匹配点还没有 cluster，现场建一个把两者都拉进去
    if (bestMatch.cluster_id) {
      cluster_id = bestMatch.cluster_id;
    } else {
      cluster_id = createCluster(bestMatch.opp_id);
      assignClusterToOpp(bestMatch.opp_id, cluster_id);
    }
    assignClusterToOpp(oppId, cluster_id);
    recomputeCluster(cluster_id);
    action = "merged";
  } else {
    // 新建 cluster，自己为 canonical
    cluster_id = createCluster(oppId);
    assignClusterToOpp(oppId, cluster_id);
    action = "created";
  }

  return {
    opportunity_id: oppId,
    cluster_id,
    action,
    max_similarity: Math.max(0, bestSim),
    matched_opportunity_id: bestMatch?.opp_id ?? null,
    model,
    cost_usd,
  };
}

/**
 * 批量回填：给所有还没 embedding 的 opportunities 算一遍并分配 cluster。
 * 用于老库升级或者修复数据。顺序处理（embedding 调用便宜但按量限速）。
 */
export async function backfillClusters(opps: Opportunity[]): Promise<{
  total: number;
  assigned: number;
  errors: number;
  total_cost_usd: number;
}> {
  let assigned = 0;
  let errors = 0;
  let total_cost_usd = 0;
  for (const o of opps) {
    try {
      const r = await assignClusterForOpportunity(o.id);
      if (r) {
        assigned++;
        total_cost_usd += r.cost_usd;
      } else {
        errors++;
      }
    } catch (err: any) {
      errors++;
      // eslint-disable-next-line no-console
      console.warn(`[clustering] backfill err opp#${o.id}:`, err?.message || err);
    }
  }
  return { total: opps.length, assigned, errors, total_cost_usd };
}
