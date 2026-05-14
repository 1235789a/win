// Twitter/X via Nitter 镜像 RSS（免 key）
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

const INSTANCES = ["https://nitter.privacydev.net", "https://nitter.poast.org", "https://nitter.cz"];
const SEARCHES = ["automation tool launch", "scraping bot", "chrome extension revenue", "side project MRR", "indie hacker ship"];

export class NitterSource implements SourceAdapter {
  name = "twitter";
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 20;
    const results: RawItem[] = [];
    for (const inst of INSTANCES) {
      if (results.length >= limit) break;
      for (const q of SEARCHES.slice(0, 3)) {
        try {
          const res = await fetch(`${inst}/search/rss?f=tweets&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(5000) });
          if (!res.ok) continue;
          const xml = await res.text();
          for (const b of xml.split("<item>").slice(1, 6)) {
            const title = (b.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || b.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").trim();
            const link = b.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
            const desc = (b.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || "").replace(/<[^>]+>/g, " ").trim();
            const text = [title, desc].filter(Boolean).join("\n");
            if (text.length < 30) continue;
            results.push({ platform: "twitter", id: `tw_${Buffer.from(link).toString("base64url").slice(0, 20)}`, text: text.slice(0, 1000), url: link.replace(inst, "https://x.com"), engagement: 0, meta: { query: q } });
          }
          await new Promise(r => setTimeout(r, 400));
        } catch {}
      }
      if (results.length > 0) break;
    }
    return results.slice(0, limit);
  }
}
