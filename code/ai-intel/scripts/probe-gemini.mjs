// 扫一遍几个 Gemini 模型，看哪个有免费配额
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("./.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const key = env.OPENAI_API_KEY;
const base = env.OPENAI_BASE_URL;
const proxy = env.HTTPS_PROXY;
const dispatcher = new ProxyAgent(proxy);

const candidates = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

console.log(`proxy=${proxy}  base=${base}\n`);

for (const model of candidates) {
  try {
    const resp = await undiciFetch(base + "chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model,
        max_tokens: 20,
        messages: [{ role: "user", content: 'Return {"ok":true}.' }],
      }),
      dispatcher,
    });
    const body = await resp.text();
    if (resp.ok) {
      let snippet = "";
      try {
        const j = JSON.parse(body);
        snippet = j.choices?.[0]?.message?.content?.slice(0, 60) ?? "";
      } catch {}
      console.log(`✅ ${model}  (HTTP ${resp.status})  -> ${snippet}`);
    } else {
      const short = body.replace(/\s+/g, " ").slice(0, 160);
      console.log(`❌ ${model}  (HTTP ${resp.status})  ${short}`);
    }
  } catch (e) {
    console.log(`💥 ${model}  ${e.message}`);
  }
}
