// DEV.to：开发者技术博客（免费 JSON API）
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

export class DevToSource implements SourceAdapter {
  name = "devto";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 25;
    const results: RawItem[] = [];
    const tags = ["automation", "webscraping", "ai", "saas", "chrome-extension", "bot", "productivity"];
    for (const tag of tags.slice(0, 5)) {
      try {
        const res = await fetch(`https://dev.to/api/articles?tag=${tag}&top=7&per_page=5`, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const posts: any[] = await res.json();
        for (const p of posts) {
          const text = [p.title, p.description || ""].filter(Boolean).join("\n\n");
          if (text.length < 30) continue;
          results.push({ platform: "devto", id: `devto_${p.id}`, text, url: p.url, published_at: p.published_at, engagement: (p.positive_reactions_count ?? 0) + (p.comments_count ?? 0), meta: { tags: (p.tag_list || []).join(",") } });
        }
        await new Promise(r => setTimeout(r, 150));
      } catch {}
    }
    results.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
    return results.slice(0, limit);
  }
}
