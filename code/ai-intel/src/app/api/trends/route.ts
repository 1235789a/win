// /api/trends —— 按 Why Now 排序的机会榜
//
// 每个 cluster 的聚合指标：
//   - base_score    : cluster 里最高分机会的 score
//   - why_now       : { score, label, growth_score, catalyst_score, matched_catalysts, window_months }
//   - cross_signal  : Phase B 跨源加分
//   - final         : 综合优先级（base 和 why_now 的加权组合）

import { NextRequest, NextResponse } from "next/server";
import { listClusters } from "@/lib/db";
import { computeClusterTrend, computeWhyNow } from "@/lib/trends";
import { computeCrossSignal } from "@/lib/cross-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 30);
  const minScore = Number(searchParams.get("min_score") ?? 0);

  const clusters = listClusters(200);
  const items = clusters
    .filter((c) => c.max_score >= minScore)
    .map((c) => {
      const trend = computeClusterTrend(c.id);
      const tagsForMatch = `${c.tags_merged} ${c.title_sample} ${c.niche_sample}`;
      const whyNow = computeWhyNow(trend, c.tags_merged, c.title_sample, c.niche_sample);
      const cross = computeCrossSignal(c);

      // final_score = base * (0.6 + 0.4 * why_now/100)
      const finalScore = Math.round(
        cross.boosted_score * (0.6 + 0.4 * whyNow.score / 100)
      );

      return {
        cluster_id: c.id,
        title: c.title_sample,
        niche: c.niche_sample,
        tags: c.tags_merged,
        member_count: c.member_count,
        canonical_opportunity_id: c.canonical_opportunity_id,
        base_score: c.max_score,
        cross_signal: {
          sources: cross.unique_sources,
          source_count: cross.source_count,
          cross_boost: cross.cross_boost,
          has_upwork: cross.has_upwork,
        },
        boosted_score: cross.boosted_score,
        trend: {
          mentions_7d: trend.mentions_7d,
          mentions_30d: trend.mentions_30d,
          mentions_90d: trend.mentions_90d,
          growth_7d_pct: Number(trend.growth_7d_pct.toFixed(2)),
          growth_30d_pct: Number(trend.growth_30d_pct.toFixed(2)),
          unique_sources_30d: trend.unique_sources_30d,
          last_mention_at: trend.last_mention_at,
          recency_ratio: Number(trend.recency_ratio.toFixed(2)),
        },
        why_now: {
          score: whyNow.score,
          label: whyNow.label,
          growth_score: whyNow.growth_score,
          catalyst_score: whyNow.catalyst_score,
          recency_score: whyNow.recency_score,
          diversity_score: whyNow.diversity_score,
          matched_catalysts: whyNow.matched_catalysts.map((m) => ({
            name: m.name,
            category: m.category,
            days_ago: m.days_ago,
            matched: m.matched_keywords,
          })),
          window_months: whyNow.window_months,
        },
        final_score: finalScore,
      };
    });

  // 按 final_score 降序
  items.sort((a, b) => b.final_score - a.final_score);

  return NextResponse.json({ items: items.slice(0, limit), total: items.length });
}
