/**
 * cheap_harvester.ts —— 免费/低成本真实痛点抓取
 *
 * 适配 Gemini 免费层：15 RPM / 1500 RPD / 1M TPM
 *  - 默认并发 4（稳稳卡在 15 RPM 下）
 *  - N=1（不跑 self-consistency）
 *  - 只跑 /api/analyze，不触发任何深加工
 *  - 最多 100 条，够你出一轮 pains.md
 *
 * 运行：
 *   终端 A：cd ai-intel; npm run dev
 *   终端 B：cd ai-intel; npx tsx scripts/cheap_harvester.ts
 */

import fs from "node:fs";
import path from "node:path";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const MAX_ITEMS = Number(process.env.MAX_ITEMS || 100);
const MIN_CHARS = Number(process.env.MIN_CHARS || 80);
const ANALYZE_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS || 120_000);
// 免费层每分钟 15 次，每次调用前加 5s 间隔缓冲（4 并发 × 15/min → 安全）
const RPM_BUDGET = Number(process.env.RPM_BUDGET || 12);
const MIN_MS_BETWEEN_CALLS = Math.ceil(60_000 / RPM_BUDGET);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SUBREDDITS = [
  "SaaS", "Entrepreneur", "indiehackers", "startups", "smallbusiness",
  "sidehustle", "webdev", "freelance", "copywriting", "marketing",
];
const REDDIT_WINDOWS: Array<"month" | "week"> = ["month", "week"];
const REDDIT_LIMIT = 25;

const HN_SOURCES = ["topstories", "askstories", "showstories"];
const HN_PER_SRC = 30;

// ---------- state ----------
let analyzeOk = 0;
let analyzeErr = 0;
let totalCost = 0;
let p0 = 0, p1 = 0, p2 = 0;
let lastCallAt = 0;

async function gate() {
  const wait = lastCallAt + MIN_MS_BETWEEN_CALLS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

async function safeJson<T = any>(url: string, ms = 15_000): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), ms);
      const r = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: ctl.signal,
      });
      clearTimeout(t);
      if (r.status === 429 || r.status === 503) {
        await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
        continue;
      }
      if (!r.ok) return null;
      return (await r.json()) as T;
    } catch {
      await new Promise((res) => setTimeout(res, 500));
    }
  }
  return null;
}

async function postJson(url: string, body: any, timeoutMs = ANALYZE_TIMEOUT_MS) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    clearTimeout(t);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false as const, error: j?.error || `HTTP ${r.status}` };
    return { ok: true as const, data: j };
  } catch (e: any) {
    clearTimeout(t);
    return { ok: false as const, error: e?.message };
  }
}

// ---------- harvest ----------
interface Item {
  platform: "reddit" | "hackernews";
  url: string;
  title: string;
  body: string;
}

async function harvestReddit(): Promise<Item[]> {
  const all: Item[] = [];
  for (const sub of SUBREDDITS) {
    for (const win of REDDIT_WINDOWS) {
      const u = `https://old.reddit.com/r/${sub}/top/.json?t=${win}&limit=${REDDIT_LIMIT}&raw_json=1`;
      const d = await safeJson<any>(u);
      const kids = d?.data?.children ?? [];
      for (const k of kids) {
        const x = k?.data;
        if (!x || x.stickied) continue;
        const url = x.permalink ? `https://www.reddit.com${x.permalink}` : x.url;
        if (!url || !x.title) continue;
        all.push({
          platform: "reddit",
          url,
          title: String(x.title).trim(),
          body: String(x.selftext || "").trim(),
        });
      }
    }
  }
  console.log(`[reddit] ${all.length}`);
  return all;
}

async function harvestHN(): Promise<Item[]> {
  const items: Item[] = [];
  const allIds = new Set<number>();
  for (const src of HN_SOURCES) {
    const ids = await safeJson<number[]>(`https://hacker-news.firebaseio.com/v0/${src}.json`);
    if (!ids) continue;
    for (const id of ids.slice(0, HN_PER_SRC)) allIds.add(id);
  }
  const stories: any[] = [];
  const ids = Array.from(allIds);
  // 20 并发拉 HN item
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= ids.length) return;
      const s = await safeJson<any>(`https://hacker-news.firebaseio.com/v0/item/${ids[i]}.json`);
      if (s) stories.push(s);
    }
  }
  await Promise.all(Array.from({ length: 20 }, () => worker()));
  for (const s of stories) {
    if (!s?.title) continue;
    const url = s.url || `https://news.ycombinator.com/item?id=${s.id}`;
    items.push({
      platform: "hackernews",
      url,
      title: s.title,
      body: (s.text || "").toString().replace(/<[^>]+>/g, " "),
    });
  }
  console.log(`[hn] ${items.length}`);
  return items;
}

// ---------- analyze ----------
async function analyzeOne(it: Item, idx: number, total: number) {
  await gate();
  const content = `${it.title}\n\n${it.body || ""}`.trim().slice(0, 8_000);
  if (content.length < MIN_CHARS) return;
  const t0 = Date.now();
  const r = await postJson(`${API_BASE}/api/analyze`, {
    text: content,
    url: it.url,
    platform: it.platform,
    save: true,
    n: 1,
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (!r.ok) {
    analyzeErr++;
    console.warn(`[${idx + 1}/${total}] ❌ ${dt}s | ${String(r.error).slice(0, 80)} | ${it.title.slice(0, 60)}`);
    return;
  }
  const j: any = r.data;
  analyzeOk++;
  const cost = j.usage?.cost_usd ?? 0;
  totalCost += cost;
  const score = j.analysis?.score ?? 0;
  const pr = j.priority ?? "";
  if (pr === "P0") p0++;
  else if (pr === "P1") p1++;
  else if (pr === "P2") p2++;
  const pain = (j.analysis?.pain_point ?? j.analysis?.title ?? "").slice(0, 60);
  console.log(
    `[${String(idx + 1).padStart(3)}/${total}] ${pr.padEnd(3)} s=${String(score).padStart(3)} ${dt}s $${cost.toFixed(4)} 💰$${totalCost.toFixed(3)} | ${pain}`
  );
}

// ---------- main ----------
async function main() {
  const started = Date.now();
  console.log(`\n🐢 cheap_harvester
  API=${API_BASE}
  concurrency=${CONCURRENCY}  RPM_budget=${RPM_BUDGET}  max_items=${MAX_ITEMS}\n`);
  console.log("[1/2] harvesting...");
  const [reddit, hn] = await Promise.all([harvestReddit(), harvestHN()]);
  let all = [...reddit, ...hn];
  const seen = new Set<string>();
  all = all.filter((x) => {
    const k = (x.url || "").split("?")[0];
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return (x.title + x.body).trim().length >= MIN_CHARS;
  });
  // 偏向有正文的（痛点密度更高）
  all.sort((a, b) => b.body.length - a.body.length);
  all = all.slice(0, MAX_ITEMS);

  console.log(`[2/2] analyzing ${all.length} items (parallel ${CONCURRENCY})\n`);

  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= all.length) return;
      try { await analyzeOne(all[i], i, all.length); }
      catch (e: any) { analyzeErr++; console.warn(`err: ${e?.message}`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, all.length) }, () => worker()));

  const mins = ((Date.now() - started) / 60_000).toFixed(1);
  console.log(`
✅ done in ${mins}min
   analyzed ok = ${analyzeOk}
   analyzed err= ${analyzeErr}
   P0/P1/P2    = ${p0} / ${p1} / ${p2}
   💰 total cost= $${totalCost.toFixed(4)}

下一步：
  cd ai-intel
  npx tsx scripts/dump_pains.ts        # 输出 data/pains.md（Top 50 真实痛点）
  UI: ${API_BASE}/opportunities
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
