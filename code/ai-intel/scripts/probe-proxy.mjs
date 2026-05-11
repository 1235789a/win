// 直接探测：代理 OK 吗？Gemini 端点 OK 吗？
import fs from "node:fs";
import { HttpsProxyAgent } from "https-proxy-agent";

// 从 .env.local 读 key（懒得 dotenv）
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
const model = env.OPENAI_MODEL || "gemini-2.5-flash";

console.log("key prefix:", key?.slice(0, 8));
console.log("proxy:     ", proxy);
console.log("model:     ", model);
console.log("");

// 用 node 原生 fetch + undici ProxyAgent 测一次
const { ProxyAgent } = await import("undici");
const dispatcher = new ProxyAgent(proxy);

const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const body = {
  model,
  messages: [{ role: "user", content: "Say OK in exactly two letters." }],
  max_tokens: 8,
};

console.log("[1/2] Testing with undici ProxyAgent...");
try {
  const t0 = Date.now();
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    // @ts-ignore
    dispatcher,
  });
  console.log(`   HTTP ${r.status}  (${Date.now() - t0}ms)`);
  const t = await r.text();
  console.log("   body:", t.slice(0, 300));
} catch (e) {
  console.log("   ✗", e.message);
}

console.log("\n[2/2] Testing with https-proxy-agent via node-fetch (openai sdk style)...");
try {
  const { default: fetchNode } = await import("node-fetch");
  const agent = new HttpsProxyAgent(proxy);
  const t0 = Date.now();
  const r = await fetchNode(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    agent,
  });
  console.log(`   HTTP ${r.status}  (${Date.now() - t0}ms)`);
  const t = await r.text();
  console.log("   body:", t.slice(0, 300));
} catch (e) {
  console.log("   ✗", e.message);
}
