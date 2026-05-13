// HackerNews 数据源：从 HN Algolia API 抓最新 Show HN / Ask HN / 热帖
// 免 key，无限流风险，每分钟 10000 次

import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

const HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date";

export class HackerNewsSource implements SourceAdapter {
  name = "hn";

  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 30;
    const maxAgeHours = opts.maxAgeHours ?? 48;

    const since = Math.floor(Date.now() / 1000) - maxAgeHours * 3600;
    const tags = "(show_hn,ask_hn,story)";
    const url = `${HN_SEARCH}?tags=${tags}&numericFilters=created_at_i>${since}&hitsPerPage=${limit}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HN API ${res.status}`);
    const data: any = await res.json();

    return (data.hits ?? []).map((h: any) => ({
      platform: "hn",
      id: `hn_${h.objectID}`,
      text: [h.title, h.story_text || h.comment_text || ""].filter(Boolean).join("\n\n"),
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      published_at: h.created_at,
      engagement: (h.points ?? 0) + (h.num_comments ?? 0),
      meta: { points: h.points, comments: h.num_comments, author: h.author },
    })) as RawItem[];
  }
}
