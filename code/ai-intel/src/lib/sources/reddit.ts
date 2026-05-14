// Reddit 匿名数据源：走 old.reddit.com/.json
// 免 key，但 IP 有限流风险（429）；加 User-Agent 和 retry

import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

const UA = "Mozilla/5.0 (compatible; ai-intel-bot/1.0)";
const DEFAULT_SUBS = [
  "SaaS",
  "microsaas",
  "indiehackers",
  "Entrepreneur",
  "startups",
  "freelance",
  "webdev",
  "smallbusiness",
  "slavelabour",
  "forhire",
  "digitalnomad",
  "selfhosted",
  "sideproject",
  "nocode",
  "Upwork",
];

async function fetchSubreddit(
  sub: string,
  limit: number
): Promise<RawItem[]> {
  const url = `https://old.reddit.com/r/${sub}/new/.json?limit=${limit}&raw_json=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
  });
  if (res.status === 429) {
    // 被限流，静默返回空
    return [];
  }
  if (!res.ok) return [];
  const data: any = await res.json();
  const posts = data?.data?.children ?? [];
  return posts
    .filter((p: any) => p.kind === "t3")
    .map((p: any) => {
      const d = p.data;
      const text = [d.title, d.selftext || ""].filter(Boolean).join("\n\n");
      return {
        platform: "reddit",
        id: `reddit_${d.id}`,
        text,
        url: `https://reddit.com${d.permalink}`,
        published_at: new Date(d.created_utc * 1000).toISOString(),
        engagement: (d.score ?? 0) + (d.num_comments ?? 0),
        meta: { subreddit: d.subreddit, score: d.score, comments: d.num_comments },
      } as RawItem;
    })
    .filter((r: RawItem) => r.text.length >= 40); // 过滤太短的
}

export class RedditSource implements SourceAdapter {
  name = "reddit";
  private subs: string[];

  constructor(subreddits?: string[]) {
    this.subs = subreddits ?? DEFAULT_SUBS;
  }

  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const perSub = Math.max(3, Math.ceil((opts.limit ?? 30) / this.subs.length));
    const results: RawItem[] = [];

    // 串行避免瞬时限流
    for (const sub of this.subs) {
      const items = await fetchSubreddit(sub, perSub);
      results.push(...items);
      // 每个 sub 之间间隔 500ms 避免 429
      await new Promise((r) => setTimeout(r, 500));
    }

    // 按 engagement 排序，取 top N
    results.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
    return results.slice(0, opts.limit ?? 30);
  }
}
