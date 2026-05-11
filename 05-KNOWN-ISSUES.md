# 05 · 已踩过的坑

> 都是真实遇到过的问题 + 当时的修复方案。接手 agent 勿再走弯路。

---

## 🕳️ 坑 1：Gemini 2.5-flash thinking 吃光 token 预算

**症状**：
- `[ai-core] AI 返回内容无法解析为 JSON`
- raw 里只有半截 JSON，往往停在 `"pain_point_analysis": "(a) 原文关键句：'...`
- usage 显示 `reasoning_tokens = 6000+`（本来该给 output 的 token 全给了 thinking）

**根因**：
Gemini 2.5-flash / 2.5-flash-lite 默认开启 thinking。OpenAI 兼容接口下 `max_tokens` 同时限制 **thinking + output**，思考一旦超过就直接截断输出。

**修复**（已在 `packages/ai-core/src/index.ts`）：

```typescript
const isGeminiWithThinking = /gemini-2\.5/.test(model);
const res = await client.chat.completions.create({
  model,
  messages,
  temperature,
  max_tokens: maxTokens,
  response_format: { type: "json_object" },
  // ⬇ 关键一行
  ...(isGeminiWithThinking ? { reasoning_effort: "none" } : {}),
});
```

**验证**：
```bash
node scripts/probe-long.mjs
# 期望：reasoning_tokens = 0
```

**勿回滚**：哪怕升到 Gemini 2.6 也先测再去掉这行。

---

## 🕳️ 坑 2：`https-proxy-agent` + `node-fetch` 在长响应上 socket hang up

**症状**：
- 短请求（prompt 几百 token）走代理 OK
- 长请求（prompt 数千 token + output 8k+）偶发 `ECONNRESET` / `socket hang up`
- 重试 3-4 次才成功

**根因**：
`https-proxy-agent` 对 CONNECT 隧道的 keepalive 实现不稳，流式长响应下 TLS 重协商容易断。

**修复**：
改用 undici 的 `ProxyAgent` 注入 OpenAI SDK 的 fetch：

```typescript
import { ProxyAgent, fetch as undiciFetch } from "undici";

const proxyAgent = new ProxyAgent(process.env.HTTPS_PROXY);

const client = new OpenAI({
  apiKey,
  baseURL,
  fetch: (input, init) =>
    undiciFetch(input, { ...init, dispatcher: proxyAgent }) as any,
});
```

Anthropic SDK 还没迁（它还用老 undici 内部机制），保留 `https-proxy-agent` 路径。

---

## 🕳️ 坑 3：Gemini 偶尔吐 ```json 围栏或前置文字

**症状**：
- `response_format: { type: "json_object" }` 设了，Gemini 还是给：
  ````
  Here's your answer:
  ```json
  { "title": "...", ... }
  ```
  ````

**修复**：
`packages/ai-core/src/index.ts` 里 `extractJSON()` 三层兜底：
1. 先找 ` ```json ... ``` ` 代码块
2. 再找裸 `{ ... }`（匹配第一个 `{` 到最后一个 `}`）
3. 都没有才报错

---

## 🕳️ 坑 4：better-sqlite3 在 Windows 装不上

**症状**：
`npm install` 卡在 `better-sqlite3` → `node-gyp` → 需要 Python / MSVC。

**修复**（二选一）：
- 装 Visual Studio Build Tools（含 C++ 桌面开发工作负载）
- 或者用预编译 binary：
  ```bash
  npm i better-sqlite3 --build-from-source=false
  ```

**完全跑不动时的兜底**：
改用 `@libsql/client`（纯 JS，无 native），改 `src/lib/db.ts` 接口即可。

---

## 🕳️ 坑 5：Next.js dev 模式下 `transpilePackages` 不生效

**症状**：
改了 `packages/ai-core/src/index.ts`，dev 没反应。

**修复**：
`ai-intel/next.config.mjs` 必须有：
```js
const nextConfig = {
  transpilePackages: ["@mi/ai-core"],
  experimental: { serverComponentsExternalPackages: ["better-sqlite3"] },
};
```

改完依然不生效 → `Ctrl+C` 停 dev 重启。Turbopack 缓存有时认不出 workspace 里的改动。

---

## 🕳️ 坑 6：PowerShell `&&` 不识别

**症状**：
`cd xxx && node yyy` 报 `ParserError: '&&' 不是此版本中的有效语句分隔符`。

**修复**：
PowerShell 用 `;` 或 `-and`，不要用 `&&`。Windows Terminal 默认是 PowerShell，不是 cmd。

```powershell
# ✅
cd ai-intel; node scripts/test-one.mjs
# ❌
cd ai-intel && node scripts/test-one.mjs
```

---

## 🕳️ 坑 7：Windows Terminal 中文乱码

**症状**：
`node scripts/test-one.mjs` 输出的中文变成 `鎻愭绮鹃€夊畼`。

**根因**：
Node 默认 UTF-8 输出，PowerShell 默认 GBK。

**修复**（两种）：
1. 临时：`chcp 65001` 切换代码页
2. 永久：PowerShell profile 加 `[Console]::OutputEncoding = [Text.Encoding]::UTF8`
3. **甩锅方案**（最常用）：用 `scripts/dump-one.mjs` 导出到 md 文件，VSCode 打开看，**数据库里内容一直是 UTF-8 干净的，只是终端显示问题**。

---

## 🕳️ 坑 8：prompt 改了之后退化成"通用 SaaS 模板"

**症状**：
改了 prompt 里的一个措辞后，blueprint 又开始出现"标准 SaaS 架构"、"用户系统"、"7 天计划"等 LLM 空话。

**根因**：
模型默认会退化到"安全模板"，唯一抵抗方法是**禁词 + 强角色 + 禁止假设**三件套。任何一条弱化都会立刻退化。

**修复**：
见 `07-PROMPT-DESIGN.md`。有禁词黑名单必须保留：

```
「标准 SaaS 架构」「现代 Web 开发」「身份认证模块」
「为产品撰写博客文章」「做 SEO 优化」「用 Stripe 集成」
（这些词一旦出现，说明模型在复读通用模板）
```

---

## 🕳️ 坑 9：`npm install` 后 `@mi/ai-core` 找不到

**症状**：
`Cannot find module '@mi/ai-core'` at build time.

**原因**：
`file:` 协议在 Windows 上对路径大小写 + 斜杠敏感。

**修复**：
```bash
cd ai-intel
npm install ../packages/ai-core  # 重新链
# 或
npm install --force
```

---

## 🕳️ 坑 10：代理连得上 Google 但连不上 Anthropic

**症状**：
Gemini 没问题，切到 Claude `ETIMEDOUT`。

**原因**：
某些机场节点对 Anthropic 的特定 endpoint 做了特殊处理。

**修复**：
- 换节点（优选美国节点）
- 或把 `ANTHROPIC_API_URL` 指到第三方中转
- 或开"全局代理"而不是"规则代理"

---

## 归档：已修不再出现

这些是上一次迭代修好的，列出来只是让接手 agent 看到历史：

- ✅ blueprint 被 8192 token 截断 → 升到 16384
- ✅ Gemini 免费档 429 一碰就红 → 加了指数退避 × 4
- ✅ Reddit 抓回来全是广告和 ">" 引用 → cleaner.ts 增加规则
- ✅ SQLite 多进程写冲突 → 改 WAL 模式
- ✅ prompt v1/v2/v3 输出通用模板 → 重写为 v4（见 07）
