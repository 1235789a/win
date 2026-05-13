// Phase B: 跨源交叉验证 + 信号加分
//
// 核心逻辑：
//   一个 cluster 里如果 members 来自多个不同平台 → 信号可信度大增
//   来自 upwork = "有人愿意付钱" → 额外加分
//
// 加分公式：
//   cross_boost = min(30, (unique_sources - 1) * 10)
//              + (has_upwork ? 5 : 0)
//              + (all_recent_7d ? 5 : 0)
//
// 用法：在每次 recomputeCluster 后调用 computeCrossSignal(cluster_id)
//       或在 /api/clusters 返回时动态计算

import { listClusters, type ClusterRow } from "./db";
import type { Opportunity } from "./types";

export interface CrossSignal {
  cluster_id: number;
  unique_sources: string[];
  source_count: number;
  has_upwork: boolean;
  has_reddit: boolean;
  all_recent_7d: boolean;
  cross_boost: number;
  boosted_score: number; // max_score + cross_boost（cap 100）
}

/**
 * 计算一个 cluster 的跨源信号加分
 */
export function computeCrossSignal(
  cluster: ClusterRow & { members: Pick<Opportunity, "source_platform" | "created_at" | "score">[] }
): CrossSignal {
  const platforms = new Set<string>();
  let allRecent = true;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  for (const m of cluster.members) {
    platforms.add(m.source_platform);
    if (m.created_at < sevenDaysAgo) allRecent = false;
  }

  const uniqueSources = Array.from(platforms);
  const sourceCount = uniqueSources.length;
  const hasUpwork = platforms.has("upwork");
  const hasReddit = platforms.has("reddit");

  // 加分公式
  let crossBoost = Math.min(30, (sourceCount - 1) * 10);
  if (hasUpwork) crossBoost += 5; // "有人悬赏" 是最强信号
  if (allRecent && cluster.members.length > 0) crossBoost += 5;

  const boostedScore = Math.min(100, cluster.max_score + crossBoost);

  return {
    cluster_id: cluster.id,
    unique_sources: uniqueSources,
    source_count: sourceCount,
    has_upwork: hasUpwork,
    has_reddit: hasReddit,
    all_recent_7d: allRecent,
    cross_boost: crossBoost,
    boosted_score: boostedScore,
  };
}

/**
 * 批量计算所有 cluster 的跨源信号，返回按 boosted_score 排序
 */
export function computeAllCrossSignals(): CrossSignal[] {
  const clusters = listClusters(200);
  const signals = clusters.map((c) => computeCrossSignal(c));
  signals.sort((a, b) => b.boosted_score - a.boosted_score);
  return signals;
}

/**
 * 对 /api/clusters 的响应做跨源加分增强
 * 在 cluster 返回体上附加 cross_signal 字段
 */
export function enrichClustersWithCrossSignal(
  clusters: (ClusterRow & { members: Pick<Opportunity, "source_platform" | "created_at" | "score">[] })[]
): (ClusterRow & { cross_signal: CrossSignal })[] {
  return clusters.map((c) => ({
    ...c,
    cross_signal: computeCrossSignal(c),
  }));
}
