import { NextRequest, NextResponse } from "next/server";
import { fetchURL } from "@/lib/fetcher";
import { cleanText } from "@/lib/cleaner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "缺少 url" }, { status: 400 });
    }
    const fetched = await fetchURL(url);
    return NextResponse.json({
      ...fetched,
      text: cleanText(fetched.text),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "fetch failed" },
      { status: 500 }
    );
  }
}
