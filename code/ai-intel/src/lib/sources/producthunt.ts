// Product Hunt：每日新产品（使用官方 RSS 源）
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAtomXML(xml: string): { title: string; link: string; summary: string; published: string }[] {
  const entries: { title: string; link: string; summary: string; published: string }[] = [];
  const entryBlocks = xml.split("<entry>").slice(1);
  for (const block of entryBlocks) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/);
    const link = linkMatch?.[1] ?? "";
    const summary = block.match(/<(?:summary|content)[^>]*>([\s\S]*?)<\/(?:summary|content)>/)?.[1]?.trim() ?? "";
    const published = block.match(/<(?:published|updated)>([\s\S]*?)<\/(?:published|updated)>/)?.[1]?.trim() ?? "";
    if (title || summary) entries.push({ title, link, summary: stripHtml(summary), published });
  }
  return entries;
}

export class ProductHuntSource implements SourceAdapter {
  name = "producthunt";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 30;
    try {
      const res = await fetch("https://www.producthunt.com/feed", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Intel/0.1; +https://example.local)" }
      });
      if (!res.ok) return [];
      const xml = await res.text();
      const entries = parseAtomXML(xml);
      
      return entries.slice(0, limit).map((e, i) => {
        const text = e.summary ? `${e.title}\n\n${e.summary}` : e.title;
        return {
          platform: "producthunt",
          id: `ph_${Date.now()}_${i}`,
          text,
          url: e.link,
          published_at: e.published || undefined,
          engagement: 1,
          meta: { source: "rss" },
        };
      }) as RawItem[];
    } catch {
      return [];
    }
  }
}
