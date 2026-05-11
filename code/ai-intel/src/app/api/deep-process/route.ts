// /api/deep-process：对某条 opportunity 执行一个 stage（critique / competitor / landing / seo / social / blueprint_en）
// 入参: { id, kind }
// 自动跳过已有 artifact（幂等）。返回 { artifact_id, content, usage, skipped? }

import { NextRequest, NextResponse } from "next/server";
import { askText } from "@/lib/ai";
import { stageBySlug } from "@/lib/deep-prompts";
import {
  getOpportunity,
  hasArtifact,
  upsertArtifact,
  listArtifacts,
} from "@/lib/db";
import type { ArtifactKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id: number;
      kind: ArtifactKind;
      force?: boolean;
    };
    const { id, kind, force } = body;
    if (!id || !kind)
      return NextResponse.json(
        { error: "id + kind required" },
        { status: 400 }
      );

    const opp = getOpportunity(id);
    if (!opp) return NextResponse.json({ error: "not found" }, { status: 404 });

    const stage = stageBySlug(kind);
    if (!stage)
      return NextResponse.json({ error: "unknown kind" }, { status: 400 });
    if (opp.score < stage.min_score) {
      return NextResponse.json(
        { error: `score ${opp.score} < min_score ${stage.min_score}` },
        { status: 400 }
      );
    }

    if (!force && hasArtifact(id, kind)) {
      return NextResponse.json({ skipped: true, reason: "already exists" });
    }

    const r = await askText({
      system: stage.system,
      user: stage.user(opp),
      temperature: 0.4,
      maxTokens: stage.max_tokens,
    });

    let content = r.data.trim();
    // landing_zh/en：去掉 ``` 包裹（模型偶尔会手抖）
    if (stage.format === "html") {
      const m = content.match(/```(?:html)?\s*([\s\S]*?)```/i);
      if (m) content = m[1].trim();
    }

    const artifact_id = upsertArtifact({
      opportunity_id: id,
      kind,
      content,
      format: stage.format,
      tokens_in: r.usage.tokens_in,
      tokens_out: r.usage.tokens_out,
      cost_usd: r.usage.cost_usd,
    });

    return NextResponse.json({
      artifact_id,
      kind,
      format: stage.format,
      length: content.length,
      content, // 直接回传，省脚本一次 GET
      usage: r.usage,
    });
  } catch (err: any) {
    console.error("[/api/deep-process]", err);
    return NextResponse.json(
      { error: err?.message ?? "deep-process failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json({ items: listArtifacts(id) });
}
