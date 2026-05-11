// 喂 3 个真实痛点给 /api/analyze，打印结果
// 字段对齐 AnalysisResult: title / target_niche / pain_point_analysis /
//                          build_once_sell_infinite / score / tags / blueprint
const PAINS = [
  {
    label: "Upwork 招聘筛简历",
    platform: "reddit",
    text: "Every time I hire on Upwork I waste 2 hours reading 50 proposals full of copy-paste bullshit. I wish something just ranked the top 3 real candidates by actual relevance to my job post. I've tried filtering by rating but bad freelancers farm 5 stars from tiny gigs. I pay $80/hr for my time and this is killing me.",
  },
  {
    label: "Discord 社区日报自动化",
    platform: "discord",
    text: "I run a Discord server with 2000 AI-curious members. Every morning I spend 45 min: open Twitter, open Reddit r/LocalLLaMA, open HN, skim, copy 5-6 items, write a summary, post to #daily-news. It's the most repetitive part of my day. I tried Zapier but the AI summaries sound like garbage LinkedIn posts.",
  },
  {
    label: "SaaS 客服重复问题",
    platform: "hackernews",
    text: "My SaaS has 20 support tickets a day. 80% are the same 5 questions: reset password, export data, billing cycle, cancel subscription, API rate limit. I answer each manually because I want to sound human and not like Intercom bot garbage. But I'm exhausted and my cofounder says I'm the bottleneck.",
  },
];

const BASE = "http://localhost:3000";

function trunc(s, n = 100) {
  if (!s) return "";
  s = String(s).replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function analyze(p) {
  const r = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: p.text, platform: p.platform, save: true }),
  });
  const j = await r.json().catch(() => ({ error: "non-json response" }));
  return { http: r.status, body: j };
}

async function analyzeWithRetry(p, label) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const t0 = Date.now();
    const { http, body } = await analyze(p);
    const ms = Date.now() - t0;
    if (!body.error) return { http, body, ms, attempt };
    if (attempt === 1) {
      console.log(`   ⚠  attempt 1 failed (${ms}ms), retrying...`);
    } else {
      return { http, body, ms, attempt };
    }
  }
}

(async () => {
  const t0 = Date.now();
  const results = [];

  for (let i = 0; i < PAINS.length; i++) {
    const p = PAINS[i];
    console.log(`\n[${i + 1}/3] ${p.label}`);
    try {
      const { http, body, ms, attempt } = await analyzeWithRetry(p);
      if (body.error) {
        console.log(`   ✗ HTTP ${http} (${ms}ms, attempt ${attempt})`);
        console.log(`   ERR: ${trunc(body.error, 200)}`);
        results.push({ p, ok: false });
        continue;
      }
      const a = body.analysis || {};
      const u = body.usage || {};
      console.log(
        `   ✓ HTTP ${http}  ${ms}ms  attempt=${attempt}  score=${a.score}  id=${body.saved_id}`
      );
      console.log(`   title:     ${a.title}`);
      console.log(`   niche:     ${a.target_niche}`);
      console.log(`   tags:      ${(a.tags || []).join(", ")}`);
      console.log(`   build1sell∞: ${a.build_once_sell_infinite}   priority: ${body.priority}`);
      console.log(`   blueprint: ${a.blueprint ? a.blueprint.length + " chars" : "(none)"}`);
      console.log(`   pain:      ${trunc(a.pain_point_analysis, 150)}`);
      console.log(
        `   tokens:    ${u.tokens_in}/${u.tokens_out}   cost:$${u.cost_usd}`
      );
      results.push({ p, ok: true, a, u, ms, id: body.saved_id, priority: body.priority });
    } catch (e) {
      console.log(`   ✗ exception: ${e.message}`);
      results.push({ p, ok: false });
    }
  }

  const ok = results.filter((r) => r.ok);
  const totalIn = ok.reduce((s, r) => s + (r.u?.tokens_in || 0), 0);
  const totalOut = ok.reduce((s, r) => s + (r.u?.tokens_out || 0), 0);
  const totalCost = ok.reduce((s, r) => s + (r.u?.cost_usd || 0), 0);

  console.log("\n" + "═".repeat(64));
  console.log(`SUMMARY  ${ok.length}/${PAINS.length} success   ${Date.now() - t0}ms   ${totalIn}in/${totalOut}out   $${totalCost.toFixed(6)}`);
  console.log("═".repeat(64));

  if (ok.length) {
    console.log("\nRanking by score:");
    ok.sort((a, b) => (b.a.score || 0) - (a.a.score || 0));
    for (const r of ok) {
      const flag = r.a.build_once_sell_infinite ? "♾️ " : "  ";
      console.log(
        `  ${String(r.a.score).padStart(3)}  ${flag}${r.priority.padEnd(6)}  ${r.a.title}`
      );
    }
    console.log(`\n  → 完整分析看: ${BASE}/opportunities`);
  }

  process.exit(ok.length === PAINS.length ? 0 : 1);
})();
