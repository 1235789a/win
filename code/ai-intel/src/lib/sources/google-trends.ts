// Google Trends 数据源：通过 SerpAPI 获取 Rising Queries
// 用于发现正在爆发的新需求
import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

function getKey() { return process.env.SERPAPI_KEY || ""; }

// 涵盖尽可能多的领域的种子词
const SEED_QUERIES = [
  "AI tool", "automation bot", "chrome extension",
  "web scraper", "saas builder", "no code",
  "ai voice", "ai video", "ai writing",
  "dropshipping tool", "crypto bot", "email marketing",
  "resume builder", "seo tool", "proxy service",
  "browser automation", "api gateway", "pdf tool",
  "invoice generator", "social media tool",
  "ai agent", "mcp server", "llm api",
  "shopify app", "tiktok tool", "linkedin automation",
  "ai image", "background remover", "ai detector",
  "vpn tool", "privacy tool", "data extraction",
];

export class GoogleTrendsSource implements SourceAdapter {
  name = "trends";

  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const SERPAPI_KEY = getKey();
    if (!SERPAPI_KEY) {
      console.warn("[google-trends] SERPAPI_KEY not set, skipping");
      return [];
    }
    const limit = opts.limit ?? 30;
    const results: RawItem[] = [];
    // 每次用 4 个种子词（SerpAPI 限额考虑）
    const seeds = SEED_QUERIES.slice(0, Math.min(8, SEED_QUERIES.length));

    for (const q of seeds) {
      try {
        const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(q)}&data_type=RELATED_QUERIES&date=now+7-d&api_key=${SERPAPI_KEY}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data: any = await res.json();
        const rising = data?.related_queries?.rising ?? [];

        for (const r of rising.slice(0, 5)) {
          const query = r.query ?? "";
          const value = r.extracted_value ?? 0;
          if (!query || value < 50) continue; // 只要 50%+ 增长的

          results.push({
            platform: "trends",
            id: `trends_${Buffer.from(query).toString("base64url").slice(0, 24)}`,
            text: `Google Trends Rising: "${query}" (${value === 8900 ? "Breakout" : `+${value}%`}) — related to "${q}"`,
            url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}&date=now+7-d`,
            published_at: new Date().toISOString(),
            engagement: value,
            meta: { seed: q, rising_value: value, breakout: value >= 5000 },
          });
        }
        await new Promise((r) => setTimeout(r, 1200)); // SerpAPI 限速
      } catch {}
    }

    // 按增长值排序
    results.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
    return results.slice(0, limit);
  }
}
