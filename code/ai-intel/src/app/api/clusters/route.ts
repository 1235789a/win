import { NextRequest, NextResponse } from "next/server";
import { listClusters, getClusterStats } from "@/lib/db";
import { computeCrossSignal } from "@/lib/cross-signal";
import { computeClusterTrend, computeWhyNow } from "@/lib/trends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const clusters = listClusters(limit);
  const stats = getClusterStats();

  // 为每个 cluster 计算跨源加分 + Why Now
  const items = clusters.map((c) => {
    const signal = computeCrossSignal(c);
    const trend = computeClusterTrend(c.id);
    const whyNow = computeWhyNow(trend, c.tags_merged, c.title_sample, c.niche_sample);
    return {
      id: c.id,
      created_at: c.created_at,
      updated_at: c.updated_at,
      canonical_opportunity_id: c.canonical_opportunity_id,
      member_count: c.member_count,
      tags_merged: c.tags_merged,
      title_sample: c.title_sample,
      niche_sample: c.niche_sample,
      max_score: c.max_score,
      cross_signal: {
        unique_sources: signal.unique_sources,
        source_count: signal.source_count,
        has_upwork: signal.has_upwork,
        cross_boost: signal.cross_boost,
        boosted_score: signal.boosted_score,
      },
      why_now: {
        score: whyNow.score,
        label: whyNow.label,
        growth_30d_pct: Number(trend.growth_30d_pct.toFixed(2)),
        mentions_30d: trend.mentions_30d,
        matched_catalysts: whyNow.matched_catalysts.map((m) => ({
          name: m.name,
          days_ago: m.days_ago,
        })),
        window_months: whyNow.window_months,
      },
      canonical: c.canonical
        ? {
            id: c.canonical.id,
            title: c.canonical.title,
            target_niche: c.canonical.target_niche,
            score: c.canonical.score,
            priority: c.canonical.priority,
            has_blueprint: c.canonical.has_blueprint,
          }
        : null,
      members: c.members.map((m) => ({
        id: m.id,
        title: m.title,
        target_niche: m.target_niche,
        score: m.score,
        priority: m.priority,
        source_platform: m.source_platform,
        source_url: m.source_url,
        created_at: m.created_at,
        has_blueprint: m.has_blueprint,
      })),
    };
  });

  // 综合排序：boosted_score * (0.6 + 0.4 * why_now/100)
  items.sort((a, b) => {
    const fa = a.cross_signal.boosted_score * (0.6 + 0.4 * a.why_now.score / 100);
    const fb = b.cross_signal.boosted_score * (0.6 + 0.4 * b.why_now.score / 100);
    return fb - fa;
  });

  return NextResponse.json({ items, stats });
}
