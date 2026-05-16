// /api/trends —— 按 Why Now 排序的机会榜
//
// 每个 cluster 的聚合指标：
//   - base_score    : cluster 里最高分机会的 score
//   - why_now       : { score, label, growth_score, catalyst_score, matched_catalysts, window_months }
//   - cross_signal  : Phase B 跨源加分
//   - final         : 综合优先级（base 和 why_now 的加权组合）

import { NextRequest, NextResponse } from "next/server";
import { listClusters, getOpportunity } from "@/lib/db";
import { computeClusterTrend, computeWhyNow } from "@/lib/trends";
import { computeCrossSignal } from "@/lib/cross-signal";
import { computeFinalScore } from "@/lib/final-score";

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

      // SEO data from canonical opportunity's analysis_json
      let seo: { keyword: string; score: number; difficulty: string; tool_sites: number; has_ads: boolean } | null = null;
      if (c.canonical_opportunity_id) {
        try {
          const opp = getOpportunity(c.canonical_opportunity_id);
          if (opp) {
            const json = JSON.parse(opp.analysis_json || "{}");
            if (json.seo?.score) {
              seo = { keyword: json.seo_keyword || json.seo.keyword || "", score: json.seo.score, difficulty: json.seo.difficulty || "medium", tool_sites: json.seo.tool_sites ?? 0, has_ads: json.seo.has_ads ?? false };
            }
          }
        } catch {}
      }

      // 四维加权评分
      const finalCalc = computeFinalScore({
        pain_score: c.max_score,
        seo_score: seo?.score ?? null,
        seo_tool_sites: seo?.tool_sites ?? null,
        why_now_score: whyNow.score,
        has_catalysts: whyNow.matched_catalysts.length > 0,
        has_trends_signal: false,
        cross_source_count: cross.source_count,
        has_upwork: cross.has_upwork,
        member_count: c.member_count,
        has_ads: seo?.has_ads ?? false,
        is_grey: false,
        single_source_only: cross.source_count <= 1,
      });

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
        seo,
        final: {
          score: finalCalc.final_score,
          pain: finalCalc.pain_weighted,
          seo_w: finalCalc.seo_weighted,
          timing: finalCalc.timing_weighted,
          biz: finalCalc.biz_weighted,
          penalties: finalCalc.penalties,
          verdict: finalCalc.verdict,
          verdict_reason: finalCalc.verdict_reason,
        },
        final_score: finalCalc.final_score,
      };
    });

  // 按 final_score 降序
  items.sort((a, b) => b.final_score - a.final_score);

  return NextResponse.json({ items: items.slice(0, limit), total: items.length });
}
