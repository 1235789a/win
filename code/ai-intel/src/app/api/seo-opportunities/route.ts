// /api/seo-opportunities — 按 SEO 可行性排序的机会榜
// 从 analysis_json 里提取 seo 字段，按 seo.score 降序

import { NextRequest, NextResponse } from "next/server";
import { listOpportunities } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SEOItem {
  id: number;
  title: string;
  target_niche: string;
  score: number;
  priority: string;
  seo_keyword: string;
  seo_score: number;
  seo_difficulty: string;
  tool_sites_in_top10: number;
  has_ads: boolean;
  long_tail: string[];
  source_platform: string;
  source_url: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 30);
  const minSeoScore = Number(searchParams.get("min_seo") ?? 0);

  const all = listOpportunities({ limit: 500 });
  const items: SEOItem[] = [];

  for (const opp of all) {
    try {
      const json = JSON.parse(opp.analysis_json || "{}");
      const seo = json.seo;
      const seoKeyword = json.seo_keyword || "";
      if (!seo || !seo.score) continue;
      if (seo.score < minSeoScore) continue;

      items.push({
        id: opp.id,
        title: opp.title,
        target_niche: opp.target_niche,
        score: opp.score,
        priority: opp.priority,
        seo_keyword: seoKeyword,
        seo_score: seo.score,
        seo_difficulty: seo.difficulty,
        tool_sites_in_top10: seo.tool_sites ?? 0,
        has_ads: seo.has_ads ?? false,
        long_tail: seo.long_tail ?? [],
        source_platform: opp.source_platform,
        source_url: opp.source_url,
        created_at: opp.created_at,
      });
    } catch {}
  }

  items.sort((a, b) => b.seo_score - a.seo_score);

  return NextResponse.json({
    items: items.slice(0, limit),
    total: items.length,
    summary: {
      easy: items.filter((i) => i.seo_difficulty === "easy").length,
      medium: items.filter((i) => i.seo_difficulty === "medium").length,
      hard: items.filter((i) => i.seo_difficulty === "hard").length,
      with_ads: items.filter((i) => i.has_ads).length,
    },
  });
}
