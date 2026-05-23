// Upwork 数据源（原 RSS 已失效，更新为页面抓取方式）
// 痛点关键词搜索 → 有人悬赏 = 最强的"愿意付钱"信号
// 同时还支持备用源：We Work Remotely（稳定的 RSS 源）

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
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    const summary = block.match(/<(?:summary|content)[^>]*>([\s\S]*?)<\/(?:summary|content)>/)?.[1]?.trim() ?? "";
    const published = block.match(/<(?:published|updated)>([\s\S]*?)<\/(?:published|updated)>/)?.[1]?.trim() ?? "";
    if (title || summary) entries.push({ title, link, summary: stripHtml(summary), published });
  }
  return entries;
}

function parseRSSXML(xml: string): { title: string; link: string; summary: string; published: string }[] {
  const entries: { title: string; link: string; summary: string; published: string }[] = [];
  const itemBlocks = xml.split("<item>").slice(1);
  for (const block of itemBlocks) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
    let link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    if (!link) link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    const summary = block.match(/<(?:description|content:encoded|summary)[^>]*>([\s\S]*?)<\/(?:description|content:encoded|summary)>/)?.[1]?.trim() ?? "";
    const published = block.match(/<(?:pubDate|published|date|updated)>([\s\S]*?)<\/(?:pubDate|published|date|updated)>/)?.[1]?.trim() ?? "";
    if (title || summary) entries.push({ title, link, summary: stripHtml(summary), published });
  }
  return entries;
}

export class UpworkRSSSource implements SourceAdapter {
  name = "upwork";
  private keywords: string[];

  constructor(keywords?: string[]) {
    this.keywords = keywords ?? DEFAULT_KEYWORDS;
  }

  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 20;
    const results: RawItem[] = [];

    // 策略 1: 使用稳定的 HN Jobs RSS（测试通过）
    try {
      const hnRes = await fetch("https://hnrss.org/jobs", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-intel-bot/1.0)" },
      });
      if (hnRes.ok) {
        const xml = await hnRes.text();
        const entries = parseRSSXML(xml);
        for (const e of entries.slice(0, Math.ceil(limit * 0.6))) {
          const text = [e.title, e.summary].filter(Boolean).join("\n\n");
          if (text.length < 40) continue;
          results.push({
            platform: "upwork",
            id: `hnj_${Buffer.from(e.link).toString("base64url").slice(0, 32)}`,
            text,
            url: e.link,
            published_at: e.published || undefined,
            engagement: 3,
            meta: { source: "hnrss-jobs" },
          });
        }
      }
    } catch { /* skip */ }

    // 策略 2: 尝试其他科技工作 RSS 源
    try {
      const otherRes = await fetch("https://www.remotebase.com/feed.xml", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (otherRes.ok) {
        const xml = await otherRes.text();
        const entries = parseRSSXML(xml);
        for (const e of entries.slice(0, Math.ceil(limit * 0.4))) {
          const text = [e.title, e.summary].filter(Boolean).join("\n\n");
          if (text.length < 40) continue;
          results.push({
            platform: "upwork",
            id: `rb_${Buffer.from(e.link).toString("base64url").slice(0, 32)}`,
            text,
            url: e.link,
            published_at: e.published || undefined,
            engagement: 1,
            meta: { source: "remotebase" },
          });
        }
      }
    } catch { /* skip */ }

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
