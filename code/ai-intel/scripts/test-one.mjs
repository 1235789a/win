// 用新 prompt + gemini-2.5-flash 跑一条 Upwork 痛点，回读 blueprint 全文
const PAIN = {
  platform: "reddit",
  text: "Every time I hire on Upwork I waste 2 hours reading 50 proposals full of copy-paste bullshit. I wish something just ranked the top 3 real candidates by actual relevance to my job post. I've tried filtering by rating but bad freelancers farm 5 stars from tiny gigs. I pay $80/hr for my time and this is killing me.",
};

(async () => {
  const t0 = Date.now();
  const r = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...PAIN, save: true }),
  });
  const j = await r.json();
  const ms = Date.now() - t0;

  console.log(`HTTP ${r.status}  (${ms}ms)`);
  if (j.error) {
    console.log("ERR:", j.error.slice(0, 300));
    process.exit(1);
  }

  const a = j.analysis;
  console.log(`id:     ${j.saved_id}`);
  console.log(`score:  ${a.score}`);
  console.log(`title:  ${a.title}`);
  console.log(`niche:  ${a.target_niche}`);
  console.log(`tags:   ${(a.tags || []).join(", ")}`);
  console.log(`tokens: ${j.usage.tokens_in}/${j.usage.tokens_out}`);
  console.log(`cost:   $${j.usage.cost_usd}`);
  console.log("");
  console.log("━━━━━━━ PAIN_POINT_ANALYSIS ━━━━━━━");
  console.log(a.pain_point_analysis);
  console.log("");
  console.log("━━━━━━━ BLUEPRINT (" + (a.blueprint?.length || 0) + " chars) ━━━━━━━");
  console.log(a.blueprint);
})();
