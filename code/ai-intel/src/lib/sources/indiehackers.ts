// IndieHackers：独立开发者社区（有收入数据）
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

export class IndieHackersSource implements SourceAdapter {
  name = "indiehackers";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 20;
    const results: RawItem[] = [];
    try {
      const res = await fetch("https://www.indiehackers.com/feed?type=popular", { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Accept: "text/html" } });
      if (!res.ok) return [];
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) return [];
      const data = JSON.parse(m[1]);
      const posts = data?.props?.pageProps?.posts || data?.props?.pageProps?.feed || [];
      for (const p of (Array.isArray(posts) ? posts : []).slice(0, limit)) {
        const text = [p.title || "", (p.body || "").slice(0, 500)].filter(Boolean).join("\n\n");
        if (text.length < 30) continue;
        results.push({ platform: "indiehackers", id: `ih_${p.id || p.slug || Math.random().toString(36).slice(2)}`, text: text.slice(0, 1500), url: p.url || `https://www.indiehackers.com/post/${p.slug || p.id}`, published_at: p.createdAt, engagement: (p.votesCount ?? 0) + (p.commentsCount ?? 0), meta: { type: p.type } });
      }
    } catch {}
    return results.slice(0, limit);
  }
}
