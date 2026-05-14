// GitHub Trending：抓取每周趋势项目（免 key，HTML parse）
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

const LANGUAGES = ["", "python", "typescript", "javascript", "go", "rust"];

export class GitHubTrendingSource implements SourceAdapter {
  name = "github";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 30;
    const results: RawItem[] = [];
    for (const lang of LANGUAGES.slice(0, 3)) {
      const url = lang ? `https://github.com/trending/${lang}?since=weekly` : `https://github.com/trending?since=weekly`;
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-intel/1.0)" } });
        if (!res.ok) continue;
        const html = await res.text();
        const articles = html.split('<article class="Box-row"').slice(1);
        for (const art of articles.slice(0, 8)) {
          const nameMatch = art.match(/href="\/([^"]+)"/);
          const descMatch = art.match(/<p class="[^"]*">([\s\S]*?)<\/p>/);
          const starsMatch = art.match(/(\d[\d,]*)\s*stars?\s*(?:this|today)/i);
          if (!nameMatch) continue;
          const repo = nameMatch[1].trim();
          const desc = (descMatch?.[1] || "").replace(/<[^>]+>/g, "").trim();
          const stars = parseInt((starsMatch?.[1] || "0").replace(/,/g, "")) || 0;
          results.push({ platform: "github", id: `gh_${repo.replace(/\//g, "_")}`, text: `${repo}: ${desc}`, url: `https://github.com/${repo}`, published_at: new Date().toISOString(), engagement: stars, meta: { language: lang || "all", stars } });
        }
        await new Promise(r => setTimeout(r, 300));
      } catch {}
    }
    results.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
    return results.slice(0, limit);
  }
}
