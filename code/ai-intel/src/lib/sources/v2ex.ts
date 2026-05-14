// V2EX：中文技术社区（华人开发者聚集地）
// 免 key JSON API
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

export class V2EXSource implements SourceAdapter {
  name = "v2ex";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 30;
    const results: RawItem[] = [];
    for (const url of ["https://www.v2ex.com/api/topics/hot.json", "https://www.v2ex.com/api/topics/latest.json"]) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const posts: any[] = await res.json();
        for (const p of posts.slice(0, 15)) {
          const text = [p.title, (p.content_rendered || p.content || "").replace(/<[^>]+>/g, " ").trim()].filter(Boolean).join("\n\n");
          if (text.length < 20) continue;
          results.push({ platform: "v2ex", id: `v2ex_${p.id}`, text: text.slice(0, 2000), url: p.url || `https://www.v2ex.com/t/${p.id}`, published_at: p.created ? new Date(p.created * 1000).toISOString() : undefined, engagement: p.replies ?? 0, meta: { node: p.node?.name } });
        }
        await new Promise(r => setTimeout(r, 200));
      } catch {}
    }
    results.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
    return results.slice(0, limit);
  }
}
