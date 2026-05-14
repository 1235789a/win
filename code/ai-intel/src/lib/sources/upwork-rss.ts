// Upwork RSS 数据源：免 key，走公开 RSS（Atom XML）
// 痛点关键词搜索 → 有人悬赏 = 最强的"愿意付钱"信号

import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

const DEFAULT_KEYWORDS = [
  "automation tool",
  "chrome extension developer",
  "workflow automation",
  "data scraping bot",
  "ai chatbot integration",
  "shopify app developer",
  "notion integration",
  "slack bot",
  "email automation",
  "pdf to structured data",
  "api integration",
  "browser extension",
  "whatsapp bot",
];

function parseAtomXML(xml: string): { title: string; link: string; summary: string; published: string }[] {
  // 极简 XML 解析（不引入 xml2js 重量级包）
  const entries: { title: string; link: string; summary: string; published: string }[] = [];
  const entryBlocks = xml.split("<entry>").slice(1);
  for (const block of entryBlocks) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    const summary = block.match(/<(?:summary|content)[^>]*>([\s\S]*?)<\/(?:summary|content)>/)?.[1]?.trim() ?? "";
    const published = block.match(/<(?:published|updated)>([\s\S]*?)<\/(?:published|updated)>/)?.[1]?.trim() ?? "";
    if (title || summary) entries.push({ title, link, summary: stripHtml(summary), published });
  }
  return entries;
}

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

export class UpworkRSSSource implements SourceAdapter {
  name = "upwork";
  private keywords: string[];

  constructor(keywords?: string[]) {
    this.keywords = keywords ?? DEFAULT_KEYWORDS;
  }

  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 20;
    const kws = opts.keywords?.length ? opts.keywords : this.keywords;
    const results: RawItem[] = [];

    // 每个关键词取 5 条（RSS 默认最多 10）
    for (const kw of kws.slice(0, 6)) {
      try {
        const q = encodeURIComponent(kw);
        const url = `https://www.upwork.com/ab/feed/jobs/rss?q=${q}&sort=recency`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-intel-bot/1.0)" },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const entries = parseAtomXML(xml);
        for (const e of entries.slice(0, 5)) {
          const text = [e.title, e.summary].filter(Boolean).join("\n\n");
          if (text.length < 40) continue;
          results.push({
            platform: "upwork",
            id: `upwork_${Buffer.from(e.link).toString("base64url").slice(0, 32)}`,
            text,
            url: e.link,
            published_at: e.published || undefined,
            engagement: 0, // Upwork 没有 upvote 概念，用"存在即信号"
            meta: { keyword: kw },
          });
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        // 静默跳过单个关键词的错误
      }
    }

    // 去重（同一 link）
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    return deduped.slice(0, limit);
  }
}
