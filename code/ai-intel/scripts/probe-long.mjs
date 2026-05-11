// 用"真实长 prompt + 大 maxTokens" 打一次，模拟 analyze 的负载
import fs from "node:fs";
import { ProxyAgent } from "undici";

const env = Object.fromEntries(
  fs
    .readFileSync("./.env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const key = env.OPENAI_API_KEY;
const proxy = env.HTTPS_PROXY || "http://127.0.0.1:7890";
const model = env.OPENAI_MODEL;
const dispatcher = new ProxyAgent(proxy);
const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const systemPrompt = "你是一名正在独立造产品的顶级全栈工程师。你只写具体痛点的具体解法，不写通用 SaaS 模板。输出严格 JSON。";
const userPrompt = `来源平台：reddit
原始内容：
"""
Every time I hire on Upwork I waste 2 hours reading 50 proposals full of copy-paste bullshit. I wish something just ranked the top 3 real candidates by actual relevance to my job post.
"""
请输出 JSON：{"title":"...","score":0-100,"blueprint":"不少于 800 字中文"}
`;

async function run(label, extra) {
  console.log(`\n[${label}]`);
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.3,
        ...extra,
      }),
      // @ts-ignore
      dispatcher,
    });
    const ms = Date.now() - t0;
    const j = await r.json();
    console.log(`   HTTP ${r.status}  ${ms}ms`);
    console.log(`   usage: ${JSON.stringify(j.usage)}`);
    console.log(`   finish: ${j.choices?.[0]?.finish_reason}`);
    const content = j.choices?.[0]?.message?.content || "";
    console.log(`   content_len: ${content.length}`);
    console.log(`   content head: ${content.slice(0, 200).replace(/\n/g, "\\n")}`);
  } catch (e) {
    console.log(`   ✗ ${Date.now() - t0}ms  ${e.message}`);
  }
}

console.log("model:", model);
await run("默认（thinking 可能开启）");
await run("reasoning_effort=none", { reasoning_effort: "none" });
await run("thinking_budget=0", {
  extra_body: { google: { thinking_config: { thinking_budget: 0 } } },
});
