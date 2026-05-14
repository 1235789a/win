// BlackHatWorld RSS：灰产/SEO/自动化核心社区
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

const FEEDS = [
  "https://www.blackhatworld.com/forums/black-hat-seo.2/index.rss",
  "https://www.blackhatworld.com/forums/social-networking.8/index.rss",
  "https://www.blackhatworld.com/forums/making-money.11/index.rss",
  "https://www.blackhatworld.com/forums/content-creation.22/index.rss",
];

function parseRSS(xml: string) {
  const items: { title: string; link: string; desc: string; date: string }[] = [];
  for (const b of xml.split("<item>").slice(1)) {
    const title = (b.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || b.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").trim();
    const link = b.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const desc = (b.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || "").replace(/<[^>]+>/g, " ").trim().slice(0, 500);
    const date = b.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    if (title) items.push({ title, link, desc, date });
  }
  return items;
}

export class BlackHatWorldSource implements SourceAdapter {
  name = "bhw";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 30;
    const results: RawItem[] = [];
    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const items = parseRSS(await res.text());
        for (const i of items.slice(0, 6)) {
          const text = [i.title, i.desc].filter(Boolean).join("\n\n");
          if (text.length < 30) continue;
          results.push({ platform: "bhw", id: `bhw_${Buffer.from(i.link).toString("base64url").slice(0, 24)}`, text, url: i.link, published_at: i.date ? new Date(i.date).toISOString() : undefined, engagement: 0, meta: { feed: feed.split("forums/")[1]?.split("/")[0] } });
        }
        await new Promise(r => setTimeout(r, 300));
      } catch {}
    }
    return results.slice(0, limit);
  }
}
