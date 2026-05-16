// SEO 可行性评分模块
// 通过 SerpAPI 查 Google 搜索结果，评估竞品密度
//
// 评分逻辑：
//   - 搜索结果中专门工具站 < 5 个 → 高机会（90+）
//   - 5-10 个 → 中机会（60-89）
//   - > 10 个 → 红海（< 60）
//   - 有 Google Trends 飙升信号 → 额外 +15
//   - 关键词有 "free" / "online" 长尾 → 额外 +10

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

export interface SEOAnalysis {
  keyword: string;
  search_results_total: number;
  tool_sites_in_top10: number; // top 10 里有几个是专门工具站
  has_ads: boolean;           // 有人投广告 = 有付费意愿
  seo_score: number;          // 0-100
  difficulty: "easy" | "medium" | "hard";
  suggested_long_tail: string[];
}

/** 用 SerpAPI 查某个关键词的 Google 搜索结果 */
export async function analyzeKeywordSEO(keyword: string): Promise<SEOAnalysis | null> {
  if (!SERPAPI_KEY) return null;

  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&num=10&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();

    const organic = data.organic_results ?? [];
    const totalResults = data.search_information?.total_results ?? 0;
    const hasAds = !!(data.ads && data.ads.length > 0);

    // 判断 top 10 里有几个是"专门工具站"（不是 blog/news/论坛）
    const toolDomains = organic.filter((r: any) => {
      const domain = (r.link ?? "").toLowerCase();
      const title = (r.title ?? "").toLowerCase();
      // 排除博客/新闻/论坛
      if (/medium\.com|blog|news|reddit|quora|stackover|youtube|wikipedia/i.test(domain)) return false;
      // 包含 tool / app / generator / maker / builder / ai 的大概率是工具站
      return /tool|app|generator|maker|builder|\.ai|remove|detect|convert/i.test(domain) ||
             /free|online|tool|generator|maker/i.test(title);
    });

    const toolCount = toolDomains.length;
    let score: number;
    if (toolCount <= 3) score = 92;
    else if (toolCount <= 5) score = 78;
    else if (toolCount <= 7) score = 62;
    else score = 40;

    if (hasAds) score = Math.min(100, score + 8); // 有人投广告 = 付费意愿
    if (totalResults < 50_000_000) score = Math.min(100, score + 5); // 竞争小

    const difficulty: "easy" | "medium" | "hard" =
      score >= 80 ? "easy" : score >= 55 ? "medium" : "hard";

    // 建议的长尾词
    const related = data.related_searches?.map((r: any) => r.query)?.slice(0, 5) ?? [];

    return {
      keyword,
      search_results_total: totalResults,
      tool_sites_in_top10: toolCount,
      has_ads: hasAds,
      seo_score: Math.round(score),
      difficulty,
      suggested_long_tail: related,
    };
  } catch {
    return null;
  }
}

/** 批量分析（每个关键词之间间隔 1.5s 避免限速） */
export async function batchAnalyzeSEO(keywords: string[]): Promise<SEOAnalysis[]> {
  const results: SEOAnalysis[] = [];
  for (const kw of keywords) {
    const r = await analyzeKeywordSEO(kw);
    if (r) results.push(r);
    await new Promise((r) => setTimeout(r, 1500));
  }
  return results;
}
