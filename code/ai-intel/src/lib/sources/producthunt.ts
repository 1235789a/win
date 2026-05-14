// Product Hunt：每日新产品（走首页 SSR JSON）
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

export class ProductHuntSource implements SourceAdapter {
  name = "producthunt";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 30;
    try {
      const res = await fetch("https://www.producthunt.com/", { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Accept: "text/html" } });
      if (!res.ok) return [];
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) return [];
      const data = JSON.parse(m[1]);
      const posts = data?.props?.pageProps?.posts ?? data?.props?.pageProps?.dailyPosts?.[0]?.posts ?? [];
      return (Array.isArray(posts) ? posts : []).slice(0, limit).map((p: any) => ({
        platform: "producthunt", id: `ph_${p.id || p.slug}`,
        text: `${p.name}: ${p.tagline}`,
        url: `https://www.producthunt.com/posts/${p.slug || p.id}`,
        published_at: p.createdAt || new Date().toISOString(),
        engagement: (p.votesCount ?? 0) + (p.commentsCount ?? 0),
        meta: { votes: p.votesCount },
      })) as RawItem[];
    } catch { return []; }
  }
}
