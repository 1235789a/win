// 核心管线 v3：
//   input → clean → AI(askJSON) → clampScore → save(含 usage) → return(含 cost)
// 支持 n（Self-consistency：跑 N 次取中位数），默认 1

import { NextRequest, NextResponse } from "next/server";
import { askJSON } from "@/lib/ai";
import { cleanText } from "@/lib/cleaner";
import { fetchURL, detectPlatform } from "@/lib/fetcher";
import { ANALYSIS_USER_PROMPT, SYSTEM_PROMPT } from "@/lib/prompts";
import { clampScore, scoreToPriority } from "@/lib/scorer";
import { insertOpportunity } from "@/lib/db";
import { assignClusterForOpportunity } from "@/lib/clustering";
import type {
  AnalysisResult,
  SourcePlatform,
  Opportunity,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface AnalyzeBody {
  text?: string;
  url?: string;
  platform?: SourcePlatform;
  save?: boolean;
  n?: number; // Self-consistency 次数，默认 1
}

function safeTags(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
}

function median(ns: number[]): number {
  const s = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeBody;
    const save = body.save !== false;
    const N = Math.max(1, Math.min(5, Number(body.n) || 1));

    let rawText = body.text?.trim() ?? "";
    let platform: SourcePlatform = body.platform ?? "manual";
    let sourceUrl: string | null = null;

    if (!rawText && body.url) {
      const fetched = await fetchURL(body.url);
      rawText = fetched.text;
      platform = fetched.platform;
      sourceUrl = body.url;
    } else if (body.url) {
      sourceUrl = body.url;
      if (!body.platform) platform = detectPlatform(body.url);
    }

    if (!rawText || rawText.length < 20) {
      return NextResponse.json(
        { error: "请提供至少 20 个字符的文本或有效 URL" },
        { status: 400 }
      );
    }

    const text = cleanText(rawText);

    // Self-consistency：N 次并行，每次用不同 temperature
    const temps = [0.2, 0.5, 0.8, 0.35, 0.65].slice(0, N);
    const runs = await Promise.all(
      temps.map((t) =>
        askJSON<Partial<AnalysisResult>>({
          system: SYSTEM_PROMPT,
          user: ANALYSIS_USER_PROMPT({ platform, text }),
          temperature: t,
          maxTokens: 65536,
        })
      )
    );

    // 分数取中位数
    const scores = runs.map((r) => clampScore(r.data.score));
    const finalScore = median(scores);

    // 取"分数最接近中位数"的那条作为内容源（稳妥派）
    const pickIdx = scores
      .map((s, i) => [Math.abs(s - finalScore), i] as [number, number])
      .sort((a, b) => a[0] - b[0])[0][1];
    const picked = runs[pickIdx].data;

    const totalUsage = runs.reduce(
      (acc, r) => {
        acc.tokens_in += r.usage.tokens_in;
        acc.tokens_out += r.usage.tokens_out;
        acc.cost_usd += r.usage.cost_usd;
        return acc;
      },
      { tokens_in: 0, tokens_out: 0, cost_usd: 0 }
    );

    const analysis: AnalysisResult = {
      title: (picked.title ?? "未命名机会").toString().slice(0, 80),
      target_niche: (picked.target_niche ?? "未指定").toString().slice(0, 120),
      pain_point_analysis: (picked.pain_point_analysis ?? "").toString(),
      build_once_sell_infinite: !!picked.build_once_sell_infinite,
      score: finalScore,
      tags: safeTags(picked.tags),
      blueprint:
        finalScore >= 80 ? (picked.blueprint ?? "").toString() : "",
    };

    const priority = scoreToPriority(analysis.score);
    const has_blueprint = analysis.blueprint.trim().length > 200 ? 1 : 0;

    let saved_id: number | null = null;
    let cluster_info: {
      cluster_id: number;
      action: "merged" | "created";
      similarity: number;
    } | null = null;
    if (save) {
      saved_id = insertOpportunity({
        source_platform: platform,
        source_url: sourceUrl,
        raw_text: text,
        title: analysis.title,
        target_niche: analysis.target_niche,
        pain_point_analysis: analysis.pain_point_analysis,
        build_once_sell_infinite: analysis.build_once_sell_infinite ? 1 : 0,
        score: analysis.score,
        priority,
        tags: analysis.tags.join(","),
        blueprint: analysis.blueprint,
        has_blueprint,
        analysis_json: JSON.stringify({ ...analysis, scores }),
        tokens_in: totalUsage.tokens_in,
        tokens_out: totalUsage.tokens_out,
        cost_usd: totalUsage.cost_usd,
        favorite: 0,
      } satisfies Omit<Opportunity, "id" | "created_at">);

      // Phase A: 实时聚类（失败不影响主流程）
      try {
        const r = await assignClusterForOpportunity(saved_id);
        if (r) {
          cluster_info = {
            cluster_id: r.cluster_id,
            action: r.action,
            similarity: Number(r.max_similarity.toFixed(3)),
          };
          totalUsage.cost_usd += r.cost_usd;
        }
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.warn("[/api/analyze] cluster failed:", err?.message || err);
      }
    }

    return NextResponse.json({
      platform,
      source_url: sourceUrl,
      analysis,
      priority,
      has_blueprint: !!has_blueprint,
      saved_id,
      cluster: cluster_info,
      n: N,
      scores,
      usage: totalUsage,
    });
  } catch (err: any) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { error: err?.message ?? "analyze failed" },
      { status: 500 }
    );
  }
}
