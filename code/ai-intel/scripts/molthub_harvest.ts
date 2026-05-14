// Molt Hub 7群体定向抓取：跨境电商/短视频/AI陪伴/灰黑产/B2B销售/逆向开发/学术求职
// 用法：npx tsx scripts/molthub_harvest.ts
// 环境变量：MAX_ITEMS=100 (默认100)  SKIP_BLUEPRINT=1 (默认跳过,省钱)

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { RedditSource, UpworkRSSSource } from "../src/lib/sources";
import type { RawItem } from "../src/lib/sources";
import { twoStepAnalyze } from "../src/lib/two-step-analyze";
import { insertOpportunity } from "../src/lib/db";
import { assignClusterForOpportunity } from "../src/lib/clustering";
import { recordMention } from "../src/lib/trends";
import type { Opportunity } from "../src/lib/types";

const MAX_ITEMS = Number(process.env.MAX_ITEMS ?? 100);
const SKIP_BP = process.env.SKIP_BLUEPRINT !== "0"; // 默认跳过

// ─── HN Algolia 搜索 ───
const HN = "https://hn.algolia.com/api/v1/search";
async function hnSearch(q: string, n = 4): Promise<RawItem[]> {
  const since = Math.floor(Date.now() / 1000) - 60 * 86400; // 60天
  const url = `${HN}?query=${encodeURIComponent(q)}&numericFilters=created_at_i>${since}&hitsPerPage=${n}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const d: any = await r.json();
  return (d.hits ?? []).map((h: any) => ({
    platform: "hn",
    id: `hn_${h.objectID}`,
    text: [h.title, h.story_text || ""].filter(Boolean).join("\n\n"),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    published_at: h.created_at,
    engagement: (h.points ?? 0) + (h.num_comments ?? 0),
    meta: { q },
  })) as RawItem[];
}

// ─── Reddit search ───
async function redditSearch(q: string, n = 4): Promise<RawItem[]> {
  const url = `https://old.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=month&limit=${n}&raw_json=1`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; molthub/1.0)" } });
  if (!r.ok) return [];
  const d: any = await r.json();
  return (d?.data?.children ?? [])
    .filter((p: any) => p.kind === "t3")
    .map((p: any) => {
      const dd = p.data;
      return {
        platform: "reddit",
        id: `reddit_${dd.id}`,
        text: [dd.title, dd.selftext || ""].filter(Boolean).join("\n\n"),
        url: `https://reddit.com${dd.permalink}`,
        published_at: new Date(dd.created_utc * 1000).toISOString(),
        engagement: (dd.score ?? 0) + (dd.num_comments ?? 0),
        meta: { q, subreddit: dd.subreddit },
      } as RawItem;
    })
    .filter((r: RawItem) => r.text.length >= 30);
}

// ─── 7 群体关键词 ───

const GROUP1_ECOM = [
  "automate Shopify orders", "dropshipping product scraper", "Amazon FBA inventory bot",
  "AliExpress review scraper", "competitor price tracker API", "AI customer service integration",
  "auto fulfill dropshipping", "TikTok shop affiliate automation", "scrape Taobao 1688 to Shopify",
];

const GROUP2_VIDEO = [
  "TikTok mass upload bot", "YouTube shorts automation", "Instagram reels scheduler",
  "download TikTok without watermark API", "AI video editor auto zoom", "auto reply YouTube comments",
  "faceless channel AI generation", "bulk translate subtitles", "Twitch stream recorder bot",
];

const GROUP3_AI_COMPANION = [
  "uncensored LLM API", "SillyTavern NSFW character card", "bypass ChatGPT filter jailbreak",
  "CharacterAI alternative no filter", "NSFW AI image prompt generator", "local AI waifu setup",
  "roleplay chat history JSON", "AI voice clone NSFW",
];

const GROUP4_GREY = [
  "Telegram mass DM bot", "Discord auto forwarder", "crypto sniping bot open source",
  "accept USDT payment gateway no KYC", "bulk email sender bypassing spam",
  "Twitter X sentiment analysis scraper", "anonymous offshore VPS", "auto mint NFT bot",
];

const GROUP5_B2B = [
  "LinkedIn lead generation bot", "scrape Google Maps emails", "cold outreach AI writer",
  "auto SEO blog generation API", "extract phone numbers from website", "bulk backlink creator",
  "Zillow real estate data scraper", "Trustpilot reviews scraper",
];

const GROUP6_REVERSE = [
  "bypass Cloudflare Turnstile", "solve reCAPTCHA v3 enterprise", "undetected Playwright script",
  "Puppeteer stealth mode bypass", "cheap residential proxy API", "reverse engineer mobile app API",
  "scrape dynamic JavaScript rendering", "bypass Akamai bot manager",
];

const GROUP7_ACADEMIC = [
  "bypass Turnitin AI detection", "AI essay humanizer tool", "auto solve Canvas quizzes",
  "LinkedIn Easy Apply bot", "resume ATS optimizer AI", "auto generate cover letters bulk",
  "homework solver API", "scrape Indeed job listings",
];

const ALL_QUERIES = [
  ...GROUP1_ECOM, ...GROUP2_VIDEO, ...GROUP3_AI_COMPANION,
  ...GROUP4_GREY, ...GROUP5_B2B, ...GROUP6_REVERSE, ...GROUP7_ACADEMIC,
];

// ─── Upwork 关键词（从7群体提炼的高付费意愿词） ───
const UPWORK_KW = [
  "web scraping bot", "browser automation", "data extraction script",
  "shopify app developer", "tiktok automation", "social media bot",
  "chrome extension developer", "api reverse engineering", "price monitoring tool",
  "lead generation scraper", "email automation", "discord bot developer",
  "ai chatbot integration", "video editing automation", "proxy rotation",
  "pdf parsing automation", "linkedin scraper", "seo tool developer",
];

// ─── Reddit subreddits（7群体聚集地） ───
const REDDIT_SUBS = [
  "webscraping", "selenium", "puppeteer", "reverseengineering", "automation",
  "dropshipping", "FulfillmentByAmazon", "shopify", "ecommerce",
  "Twitch", "NewTubers", "InstagramMarketing",
  "LocalLLaMA", "CharacterAI",
  "cryptocurrency", "defi", "telegramBots",
  "coldoutreach", "digitalnomad", "Emailmarketing",
  "cscareerquestions", "resumes", "jobsearch",
  "selfhosted", "sideproject", "microsaas",
];

// ─── 工具函数 ───
function dedup(items: RawItem[]): RawItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

async function pool<T, R>(items: T[], n: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const res: R[] = new Array(items.length);
  let c = 0;
  async function w() { while (c < items.length) { const i = c++; res[i] = await fn(items[i], i); } }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, w));
  return res;
}

// ─── 主流程 ───
async function main() {
  const t0 = Date.now();
  console.log(`\n🦎 Molt Hub 7群体定向抓取`);
  console.log(`  关键词: ${ALL_QUERIES.length} (HN+Reddit) + ${UPWORK_KW.length} (Upwork)`);
  console.log(`  max_items=${MAX_ITEMS}  skip_blueprint=${SKIP_BP}\n`);

  const allItems: RawItem[] = [];

  // 1. HN keyword search (60天)
  console.log("[1/3] HN Algolia search...");
  for (const q of ALL_QUERIES) {
    allItems.push(...await hnSearch(q, 3));
    await new Promise((r) => setTimeout(r, 40));
  }
  const hnCount = allItems.length;
  console.log(`  hn: ${hnCount}`);

  // 2. Reddit search
  console.log("[2/3] Reddit search...");
  const rStart = allItems.length;
  for (const q of ALL_QUERIES.slice(0, 25)) { // 前25个词搜reddit
    allItems.push(...await redditSearch(q, 3));
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`  reddit: ${allItems.length - rStart}`);

  // 3. Reddit subreddits
  console.log("      Reddit subs...");
  const rsStart = allItems.length;
  try {
    const rSrc = new RedditSource(REDDIT_SUBS);
    const rItems = await rSrc.harvest({ limit: 50 });
    allItems.push(...rItems);
  } catch {}
  console.log(`  reddit subs: ${allItems.length - rsStart}`);

  // 4. Upwork RSS
  console.log("[3/3] Upwork RSS...");
  const uStart = allItems.length;
  try {
    const uSrc = new UpworkRSSSource(UPWORK_KW);
    const uItems = await uSrc.harvest({ limit: 40 });
    allItems.push(...uItems);
  } catch {}
  console.log(`  upwork: ${allItems.length - uStart}`);

  const batch = dedup(allItems).slice(0, MAX_ITEMS);
  console.log(`\n  total=${allItems.length} unique=${dedup(allItems).length} batch=${batch.length}\n`);

  // 分析
  console.log("[4/4] Analyzing...\n");
  let ok = 0, err = 0, p0 = 0, p1 = 0, cost = 0;
  const results: { score: number; title: string; niche: string; priority: string; query: string; platform: string }[] = [];

  await pool(batch, 5, async (item, idx) => {
    try {
      const r = await twoStepAnalyze(item.platform, item.text, { skipBlueprint: SKIP_BP });
      cost += r.usage.cost_usd;
      if (r.score < 40) { ok++; return; }

      const id = insertOpportunity({
        source_platform: item.platform as any,
        source_url: item.url,
        raw_text: item.text,
        title: r.title,
        target_niche: r.target_niche,
        pain_point_analysis: r.pain_point_analysis,
        build_once_sell_infinite: r.build_once_sell_infinite ? 1 : 0,
        score: r.score,
        priority: r.priority as any,
        tags: r.tags.join(","),
        blueprint: r.blueprint,
        has_blueprint: r.blueprint.length > 200 ? 1 : 0,
        analysis_json: JSON.stringify(r),
        tokens_in: r.usage.tokens_in,
        tokens_out: r.usage.tokens_out,
        cost_usd: r.usage.cost_usd,
        favorite: 0,
      } satisfies Omit<Opportunity, "id" | "created_at">);

      try { await assignClusterForOpportunity(id); } catch {}
      try {
        recordMention({
          cluster_id: null,
          opportunity_id: id,
          source_platform: item.platform,
          mentioned_at: item.published_at ?? new Date().toISOString(),
          engagement: item.engagement ?? 0,
          text_sample: item.text.slice(0, 200),
        });
      } catch {}

      if (r.priority === "P0") p0++;
      if (r.priority === "P1") p1++;
      if (r.score >= 60) {
        results.push({
          score: r.score, title: r.title, niche: r.target_niche?.slice(0, 55) || "",
          priority: r.priority, query: (item.meta as any)?.q || "", platform: item.platform,
        });
        const icon = r.priority === "P0" ? "🔥" : r.priority === "P1" ? "📈" : "  ";
        console.log(`${icon} s=${r.score} [${item.platform}] | ${r.title.slice(0, 50)}`);
      }
      ok++;
    } catch { err++; }
  });

  // 输出汇总
  results.sort((a, b) => b.score - a.score);
  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n${"━".repeat(50)}`);
  console.log(`✅ ${elapsed}min  batch=${batch.length} ok=${ok} err=${err}`);
  console.log(`   P0=${p0}  P1=${p1}  cost=$${cost.toFixed(4)}`);
  console.log(`\n按群体分布:`);
  console.log(`   跨境电商: ${results.filter(r => GROUP1_ECOM.some(q => r.query.includes(q.slice(0, 10)))).length}`);
  console.log(`   短视频:   ${results.filter(r => GROUP2_VIDEO.some(q => r.query.includes(q.slice(0, 10)))).length}`);
  console.log(`   AI陪伴:   ${results.filter(r => GROUP3_AI_COMPANION.some(q => r.query.includes(q.slice(0, 10)))).length}`);
  console.log(`   灰黑产:   ${results.filter(r => GROUP4_GREY.some(q => r.query.includes(q.slice(0, 10)))).length}`);
  console.log(`   B2B销售:  ${results.filter(r => GROUP5_B2B.some(q => r.query.includes(q.slice(0, 10)))).length}`);
  console.log(`   逆向开发: ${results.filter(r => GROUP6_REVERSE.some(q => r.query.includes(q.slice(0, 10)))).length}`);
  console.log(`   学术求职: ${results.filter(r => GROUP7_ACADEMIC.some(q => r.query.includes(q.slice(0, 10)))).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
