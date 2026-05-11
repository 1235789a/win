import { NextRequest, NextResponse } from "next/server";
import {
  deleteOpportunity,
  getOpportunity,
  listOpportunities,
  toggleFavorite,
  updateTags,
} from "@/lib/db";
import type { Priority } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const row = getOpportunity(Number(id));
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(row);
  }

  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);
  const niche = searchParams.get("niche") || undefined;
  const minScore = searchParams.get("minScore");
  const favoriteOnly = searchParams.get("favoriteOnly") === "1";
  const hasBlueprint = searchParams.get("hasBlueprint") === "1";
  const q = searchParams.get("q") || undefined;
  const priority = (searchParams.get("priority") || undefined) as
    | Priority
    | undefined;

  const items = listOpportunities({
    limit,
    offset,
    niche,
    minScore: minScore ? Number(minScore) : undefined,
    favoriteOnly,
    hasBlueprint,
    q,
    priority,
  });
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    id: number;
    action: "toggleFavorite" | "updateTags";
    tags?: string;
  };
  if (!body?.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  if (body.action === "toggleFavorite") {
    const now = toggleFavorite(body.id);
    return NextResponse.json({ favorite: now });
  }
  if (body.action === "updateTags") {
    updateTags(body.id, body.tags ?? "");
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  deleteOpportunity(id);
  return NextResponse.json({ ok: true });
}
