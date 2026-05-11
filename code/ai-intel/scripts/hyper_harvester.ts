/**
 * hyper_harvester.ts v3-turbo —— 极限烧钱模式
 *
 * 关键特性：
 *  - 两个独立并发池：analyze (默认 30) 与 deep-process (默认 15)
 *  - analyze 完成不等深加工，立刻进下一条；深加工在后台 fire-and-forget
 *  - 深加工回包直接带 content，省一次 GET 往返
 *  - 每次 AI 调用读 cost_usd 累计；触 BUDGET_USD * 0.96 熔断
 *  - 实际烧钱速度取决于 Anthropic 账号 tier 的 OTPM
 *
 * 运行（PowerShell）：
 *   终端 A：cd ai-intel; npm run dev
 *   终端 B：cd ai-intel;
 *           $env:BUDGET_USD=250
 *           $env:ANALYZE_CONCURRENCY=30
 *           $env:DEEP_CONCURRENCY=15
 *           $env:SELF_CONSISTENCY_N=3
 *           npx tsx scripts/hyper_harvester.ts
 */

import fs from "node:fs";
import path from "node:path";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const ANALYZE_CONCURRENCY = Number(process.env.ANALYZE_CONCURRENCY || process.env.CONCURRENCY || 30);
const DEEP_CONCURRENCY = Number(process.env.DEEP_CONCURRENCY || 15);
const SELF_CONSISTENCY_N = Number(process.env.SELF_CONSISTENCY_N || 3);
const MAX_ITEMS = Number(process.env.MAX_ITEMS || 2000);
const MIN_CHARS = Number(process.env.MIN_CHARS || 60);
const BUDGET_USD = Number(process.env.BUDGET_USD || 250);
const STOP_AT = BUDGET_USD * 0.96;
const ANALYZE_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS || 300_000);
const DEEP_ONLY = process.env.DEEP_ONLY === "1";
const SKIP_HN_COMMENTS = process.env.SKIP_HN_COMMENTS === "1";
// Reddit 对空 UA / 带 "bot/crawler" 的 UA 会 403，所以伪装成浏览器
const UA =
  process.env.HARVESTER_UA ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ARTIFACTS_DIR = "./data/artifacts";
const RUNS_DIR = "./data/runs";

const SUBREDDITS = [
  "SaaS", "Entrepreneur", "indiehackers", "startups", "smallbusiness",
  "EntrepreneurRideAlong", "digitalnomad", "ecommerce", "FulfillmentByAmazon",
  "dropship", "shopify", "Affiliatemarketing", "marketing", "copywriting",
  "ContentCreation", "juststart", "sidehustle", "freelance", "webdev", "nextjs",
];
const REDDIT_WINDOWS: Array<"month" | "week" | "hot"> = ["month", "week", "hot"];
const REDDIT_LIMIT = 50;

const HN_SOURCES = ["topstories", "beststories", "askstories", "showstories"];
const HN_PER_SRC = 60;
const HN_COMMENTS_PER_STORY = 3;

const DEEP_STAGES: Array<{ kind: string; min_score: number }> = [
  { kind: "critique", min_score: 60 },
  { kind: "competitor_scan", min_score: 70 },
  { kind: "landing_zh", min_score: 80 },
  { kind: "landing_en", min_score: 80 },
  { kind: "seo_zh", min_score: 80 },
  { kind: "seo_en", min_score: 80 },
  { kind: "social_pack", min_score: 80 },
  { kind: "blueprint_en", min_score: 80 },
];

// ---------- state ----------
let totalCostUsd = 0;
let analyzeOk = 0;
let analyzeErr = 0;
let deepOk = 0;
let deepErr = 0;
let p0 = 0;
let p1 = 0;
let stopped = false;
let deepInflight = 0;

const runLabel = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(RUNS_DIR, runLabel);
fs.mkdirSync(runDir, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
const eventsStream = fs.createWriteStream(path.join(runDir, "events.jsonl"), { flags: "a" });

function logEvent(kind: string, payload: any) {
  try {
    eventsStream.write(JSON.stringify({ ts: new Date().toISOString(), kind, ...payload }) + "\n");
  } catch {}
}

function budgetHit() {
  if (!stopped && totalCostUsd >= STOP_AT) {
    stopped = true;
    console.warn(`\n🛑 预算熔断 — 已烧 $${totalCostUsd.toFixed(2)} / $${BUDGET_USD}。停止派发新任务。\n`);
  }
  return stopped;
}

// ---------- deep queue（后台池） ----------
interface DeepJob {
  opp_id: number;
  kind: string;
  title: string;
}
const deepQueue: DeepJob[] = [];
let deepWorkers: Promise<void>[] = [];

function startDeepWorkers() {
  for (let i = 0; i < DEEP_CONCURRENCY; i++) {
    deepWorkers.push((async () => {
      while (true) {
        if (stopped && deepQueue.length === 0) return;
        const job = deepQueue.shift();
        if (!job) {
          if (stopped) return;
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        deepInflight++;
        try {
          await deepOne(job);
        } catch (e: any) {
          console.warn(`[deep worker] ${e?.message}`);
        } finally {
          deepInflight--;
        }
      }
    })());
  }
}

async function waitDeepDrain() {
  while (deepQueue.length > 0 || deepInflight > 0) {
    await new Promise((r) => setTimeout(r, 500));
  }
  stopped = true; // 让 workers 退出
  await Promise.all(deepWorkers);
}

// ---------- fetch helpers ----------
async function safeJson<T = any>(url: string, ms = 20_000): Promise<T | null> {
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
        await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
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
  platform: "reddit" | "hackernews" | "lobsters";
  url: string;
  title: string;
  body: string;
}

async function harvestReddit(): Promise<Item[]> {
  const all: Item[] = [];
  const tasks: Promise<void>[] = [];
  for (const sub of SUBREDDITS) {
    for (const win of REDDIT_WINDOWS) {
      // old.reddit.com 对匿名 JSON 更宽容
      const u = win === "hot"
        ? `https://old.reddit.com/r/${sub}/hot/.json?limit=${REDDIT_LIMIT}&raw_json=1`
        : `https://old.reddit.com/r/${sub}/top/.json?t=${win}&limit=${REDDIT_LIMIT}&raw_json=1`;
      tasks.push((async () => {
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
      })());
    }
  }
  await Promise.all(tasks);
  console.log(`[reddit] raw=${all.length}`);
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
  const ids = Array.from(allIds);
  const stories = await runFetchPool(ids, 20, (id) =>
    safeJson<any>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  );
  const commentJobs: Array<{ item: Item; cid: number }> = [];
  for (const s of stories) {
    if (!s?.title) continue;
    const url = s.url || `https://news.ycombinator.com/item?id=${s.id}`;
    const it: Item = {
      platform: "hackernews",
      url,
      title: s.title,
      body: (s.text || "").toString(),
    };
    items.push(it);
    if (!SKIP_HN_COMMENTS) {
      for (const cid of (s.kids || []).slice(0, HN_COMMENTS_PER_STORY)) {
        commentJobs.push({ item: it, cid });
      }
    }
  }
  if (commentJobs.length) {
    await runFetchPool(commentJobs, 25, async (j) => {
      const c = await safeJson<any>(`https://hacker-news.firebaseio.com/v0/item/${j.cid}.json`);
      if (c?.text) {
        const txt = String(c.text).replace(/<[^>]+>/g, " ").trim();
        if (txt) j.item.body += `\n\n[comment] ${txt}`;
      }
    });
  }
  console.log(`[hn] stories=${items.length}`);
  return items;
}

async function harvestLobsters(): Promise<Item[]> {
  const d = await safeJson<any[]>("https://lobste.rs/hottest.json");
  if (!Array.isArray(d)) return [];
  const items: Item[] = d.slice(0, 80).map((x) => ({
    platform: "lobsters" as const,
    url: x.url || x.short_id_url,
    title: x.title || "",
    body: (x.description || "").replace(/<[^>]+>/g, " ").trim(),
  }));
  console.log(`[lobsters] ${items.length}`);
  return items;
}

async function runFetchPool<T, R>(
  items: T[],
  limit: number,
  fn: (x: T, i: number) => Promise<R>
): Promise<Array<R | undefined>> {
  const out: Array<R | undefined> = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try { out[i] = await fn(items[i], i); } catch { out[i] = undefined; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

// ---------- deep-one（DEEP pool 里的 worker 调用） ----------
async function deepOne(job: DeepJob) {
  if (totalCostUsd >= STOP_AT) return;
  const t0 = Date.now();
  const r = await postJson(`${API_BASE}/api/deep-process`, {
    id: job.opp_id,
    kind: job.kind,
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (!r.ok) {
    deepErr++;
    console.warn(`  └─ ❌ ${job.kind.padEnd(16)} ${dt}s | ${r.error} | ${job.title.slice(0, 45)}`);
    logEvent("deep.err", { opp_id: job.opp_id, kind: job.kind, error: r.error });
    return;
  }
  const j: any = r.data;
  if (j.skipped) return;
  deepOk++;
  const cost = j.usage?.cost_usd ?? 0;
  totalCostUsd += cost;
  console.log(
    `  └─ 📘 ${job.kind.padEnd(16)} ${dt}s $${cost.toFixed(3)} ${String(j.length).padStart(5)}ch 💰$${totalCostUsd.toFixed(2)}/${BUDGET_USD} | opp#${job.opp_id}`
  );
  logEvent("deep.ok", { opp_id: job.opp_id, kind: job.kind, cost, length: j.length });

  // 磁盘镜像（deep-process 回包带 content）
  try {
    const dir = path.join(ARTIFACTS_DIR, String(job.opp_id));
    fs.mkdirSync(dir, { recursive: true });
    const ext = j.format === "html" ? "html" : "md";
    if (j.content) {
      fs.writeFileSync(path.join(dir, `${job.kind}.${ext}`), j.content, "utf8");
    }
  } catch (e: any) {
    console.warn(`  └─ disk err: ${e?.message}`);
  }
  budgetHit();
}

// ---------- analyze one ----------
async function analyzeOne(it: Item, idx: number, total: number) {
  if (budgetHit()) return;
  const content = `${it.title}\n\n${it.body || ""}`.trim().slice(0, 16_000);
  if (content.length < MIN_CHARS) return;

  const t0 = Date.now();
  const r = await postJson(`${API_BASE}/api/analyze`, {
    text: content,
    url: it.url,
    platform: it.platform,
    save: true,
    n: SELF_CONSISTENCY_N,
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  if (!r.ok) {
    analyzeErr++;
    console.warn(`[${idx + 1}/${total}] ❌ ${dt}s | ${r.error} | ${it.title.slice(0, 55)}`);
    logEvent("analyze.err", { url: it.url, error: r.error });
    return;
  }

  const j: any = r.data;
  analyzeOk++;
  const cost = j.usage?.cost_usd ?? 0;
  totalCostUsd += cost;
  const score = j.analysis?.score ?? 0;
  const pr = j.priority ?? "";
  const niche = (j.analysis?.target_niche ?? "").slice(0, 24);
  const blue = j.has_blueprint ? "📘" : "  ";
  if (pr === "P0") p0++;
  else if (pr === "P1") p1++;

  console.log(
    `[${String(idx + 1).padStart(4)}/${total}] ${blue} ${pr} s=${String(score).padStart(3)} ${dt}s $${cost.toFixed(3)} 💰$${totalCostUsd.toFixed(2)}/${BUDGET_USD} q=${deepQueue.length} | ${niche.padEnd(24)} | ${it.title.slice(0, 50)}`
  );
  logEvent("analyze.ok", { url: it.url, saved_id: j.saved_id, score, priority: pr, cost });

  if (j.saved_id) {
    try {
      const dir = path.join(ARTIFACTS_DIR, String(j.saved_id));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "analysis.json"), JSON.stringify(j, null, 2), "utf8");
      if (j.analysis?.blueprint) {
        fs.writeFileSync(path.join(dir, "blueprint_zh.md"), j.analysis.blueprint, "utf8");
      }
    } catch {}

    // enqueue 深加工，不阻塞 analyze
    if (score >= 60 && !stopped) {
      for (const s of DEEP_STAGES) {
        if (score >= s.min_score) {
          deepQueue.push({ opp_id: j.saved_id, kind: s.kind, title: j.analysis?.title ?? "" });
        }
      }
    }
  }
  budgetHit();
}

// ---------- DEEP_ONLY ----------
async function deepOnlyMode() {
  console.log("[DEEP_ONLY] 从 DB 拉高分条目补深加工");
  const r = await fetch(`${API_BASE}/api/opportunities?minScore=60&limit=500`).then((r) => r.json());
  const items: any[] = r.items ?? [];
  console.log(`[DEEP_ONLY] candidates=${items.length}`);
  for (const o of items) {
    for (const s of DEEP_STAGES) {
      if (o.score >= s.min_score) {
        deepQueue.push({ opp_id: o.id, kind: s.kind, title: o.title });
      }
    }
  }
  console.log(`[DEEP_ONLY] queued=${deepQueue.length}`);
}

// ---------- main ----------
async function main() {
  const started = Date.now();
  console.log(`\n🔥 hyper_harvester v3-turbo
  API=${API_BASE}
  analyze_concurrency=${ANALYZE_CONCURRENCY}
  deep_concurrency=${DEEP_CONCURRENCY}
  self_consistency_n=${SELF_CONSISTENCY_N}
  budget=$${BUDGET_USD}  (stop at $${STOP_AT.toFixed(2)})
  max_items=${MAX_ITEMS}
  deep_only=${DEEP_ONLY}
  run_dir=${runDir}\n`);

  startDeepWorkers();

  if (DEEP_ONLY) {
    await deepOnlyMode();
  } else {
    console.log("[1/2] harvesting sources...");
    const [reddit, hn, lobsters] = await Promise.all([
      harvestReddit(),
      harvestHN(),
      harvestLobsters(),
    ]);
    let all = [...reddit, ...hn, ...lobsters];
    const seen = new Set<string>();
    all = all.filter((x) => {
      const k = (x.url || "").split("?")[0];
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return (x.title + x.body).trim().length >= MIN_CHARS;
    });
    all.sort((a, b) => b.body.length - a.body.length);
    all = all.slice(0, MAX_ITEMS);
    console.log(`[2/2] analyzing ${all.length} items (parallel ${ANALYZE_CONCURRENCY})\n`);
    logEvent("plan", { items: all.length, budget: BUDGET_USD, n: SELF_CONSISTENCY_N });

    // analyze pool
    let next = 0;
    async function analyzeWorker() {
      while (!budgetHit()) {
        const i = next++;
        if (i >= all.length) return;
        await analyzeOne(all[i], i, all.length);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(ANALYZE_CONCURRENCY, all.length) }, () => analyzeWorker())
    );
  }

  console.log(`\n[drain] analyze 完成，等深加工队列清空 (剩 ${deepQueue.length} + 飞 ${deepInflight})...`);
  await waitDeepDrain();

  const mins = ((Date.now() - started) / 60_000).toFixed(1);
  const summary = `
✅ done in ${mins}min
   analyzed ok = ${analyzeOk}
   analyzed err= ${analyzeErr}
   deep ok     = ${deepOk}
   deep err    = ${deepErr}
   P0          = ${p0}
   P1          = ${p1}
   💰 total cost = $${totalCostUsd.toFixed(2)} / $${BUDGET_USD}

产物：
  DB:   ai-intel/data/intel.db
  磁盘: ai-intel/data/artifacts/<id>/
  日志: ${runDir}/events.jsonl
  UI:   ${API_BASE}/opportunities?minScore=80
`;
  console.log(summary);
  fs.writeFileSync(path.join(runDir, "summary.md"), summary, "utf8");
  fs.writeFileSync(path.join(runDir, "budget.json"), JSON.stringify({
    budget_usd: BUDGET_USD,
    total_cost_usd: Number(totalCostUsd.toFixed(4)),
    analyzed_ok: analyzeOk,
    analyzed_err: analyzeErr,
    deep_ok: deepOk,
    deep_err: deepErr,
    p0, p1,
    duration_min: Number(mins),
  }, null, 2));
  eventsStream.end();
}

main().catch((e) => {
  console.error(e);
  eventsStream.end();
  process.exit(1);
});
