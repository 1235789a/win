import { NextRequest, NextResponse } from "next/server";
import { listClusters, getClusterStats } from "@/lib/db";
import { computeCrossSignal } from "@/lib/cross-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const clusters = listClusters(limit);
  const stats = getClusterStats();

  // 为每个 cluster 计算跨源加分
  const items = clusters.map((c) => {
    const signal = computeCrossSignal(c);
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
      // 跨源信号
      cross_signal: {
        unique_sources: signal.unique_sources,
        source_count: signal.source_count,
        has_upwork: signal.has_upwork,
        cross_boost: signal.cross_boost,
        boosted_score: signal.boosted_score,
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

  // 按 boosted_score 排序
  items.sort((a, b) => b.cross_signal.boosted_score - a.cross_signal.boosted_score);

  return NextResponse.json({ items, stats });
}
