/**
 * @mi/ai-core
 * ────────────────────────────────────────────────────────────────
 * 本地通用 AI 客户端：Anthropic / OpenAI / Gemini(OpenAI-compat) 三合一
 *
 * 设计目标：
 *   1. 业务层只调 askJSON() / askText()，不关心换 provider / 换模型
 *   2. 大陆环境自动走代理（读 HTTPS_PROXY / HTTP_PROXY）
 *   3. 429 / 5xx 自动指数退避重试
 *   4. Gemini OpenAI-compat 端点自动兼容（去 response_format, 加 JSON-only 指令）
 *   5. 返回体带 usage + cost_usd，方便预算熔断
 *
 * 使用：
 *   import { askJSON, askText, createAIClient } from "@mi/ai-core";
 *
 *   // 1) 零配置（读 process.env 里的 AI_PROVIDER / OPENAI_* / ANTHROPIC_* / *_PROXY）
 *   const { data, usage } = await askJSON<{ score: number }>({
 *     system: "...",
 *     user: "...",
 *   });
 *
 *   // 2) 显式配置（不走 env，直接传）
 *   const ai = createAIClient({
 *     provider: "openai",
 *     apiKey: "AIza...",
 *     baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
 *     model: "gemini-2.5-flash-lite",
 *     proxy: "http://127.0.0.1:7890",
 *   });
 *   const r = await ai.askJSON({ system: "...", user: "..." });
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";
// undici 是 Node 18+ 内建模块，不走 npm package.json；用动态 import 绕过 TS 的 moduleResolution
// @ts-ignore - Node 内建，TS 类型可能找不到
import * as undici from "undici";

// ─────────────────────── 类型 ───────────────────────

export type Provider = "anthropic" | "openai";

export interface AIClientOptions {
  /** anthropic（Claude）或 openai（含 Gemini/DeepSeek 等 OpenAI 兼容端点） */
  provider?: Provider;
  apiKey?: string;
  /** openai-兼容端点的 baseURL；openai 默认 https://api.openai.com/v1 */
  baseURL?: string;
  model?: string;
  /** 代理地址，如 http://127.0.0.1:7890；不传则读 env.HTTPS_PROXY/HTTP_PROXY */
  proxy?: string;
  /** 默认 temperature */
  temperature?: number;
  /** 默认 max_tokens */
  maxTokens?: number;
  /** 重试次数（默认 4） */
  maxRetries?: number;
  /** 自定义价格表（USD / 1M tokens） */
  pricing?: Record<string, { in: number; out: number }>;
}

export interface AskOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** 覆盖默认模型 */
  model?: string;
}

export interface Usage {
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
  provider: Provider;
}

export interface AskResult<T> {
  data: T;
  raw: string;
  usage: Usage;
}

// ─────────────────────── 默认价格表 ───────────────────────

export const DEFAULT_PRICING: Record<string, { in: number; out: number }> = {
  // Anthropic（USD / 1M tokens）
  "claude-opus-4-20250514": { in: 15, out: 75 },
  "claude-opus-4-1-20250805": { in: 15, out: 75 },
  "claude-sonnet-4-20250514": { in: 3, out: 15 },
  "claude-3-5-sonnet-20241022": { in: 3, out: 15 },
  "claude-3-5-haiku-20241022": { in: 0.8, out: 4 },
  // OpenAI
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  // Gemini free tier（AI Studio 额度内 = 0 成本；超了会拒绝而不是扣费）
  "gemini-2.0-flash": { in: 0, out: 0 },
  "gemini-2.0-flash-exp": { in: 0, out: 0 },
  "gemini-2.0-flash-lite": { in: 0, out: 0 },
  "gemini-2.5-flash": { in: 0, out: 0 },
  "gemini-2.5-flash-lite": { in: 0, out: 0 },
  "gemini-2.5-flash-preview-05-20": { in: 0, out: 0 },
  "gemini-1.5-flash": { in: 0, out: 0 },
  "gemini-1.5-flash-8b": { in: 0, out: 0 },
  // DeepSeek V4（2026 年 4 月发布）—— OpenAI 兼容，但 thinking 关法不一样
  "deepseek-v4-flash": { in: 0.14, out: 0.56 },     // $0.14/$0.56 per 1M tokens
  "deepseek-v4-pro": { in: 0.55, out: 2.2 },        // 估算值
  "deepseek-chat": { in: 0.27, out: 1.1 },          // V3 兼容别名
  "deepseek-reasoner": { in: 0.55, out: 2.2 },
};
const UNKNOWN_PRICE = { in: 15, out: 75 }; // 未知模型按 Opus 兜底（安全派）

// ─────────────────────── 工具 ───────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 从原始响应里抽出最外层 JSON 对象。能正确处理 Gemini 常见的
 *  1) 裸 JSON  2) ```json 围栏  3) 在 string value 里嵌套 ```sql 围栏
 *  4) 输出被 max_tokens 截断（末尾没有 }）—— 截断时尝试修复使其可解析 */
export function extractJSON(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  // 正常情况：有完整的 { ... }
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }

  // 截断情况：有 { 但没有 }（或 } 在 { 之前——不太可能）
  if (first !== -1) {
    return repairTruncatedJSON(text.slice(first));
  }

  // ```json 围栏（完整）
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  // ```json 围栏（被截断，没有闭合的 ```）
  const fencedOpen = text.match(/```(?:json)?\s*([\s\S]+)$/i);
  if (fencedOpen) {
    const inner = fencedOpen[1].trim();
    const f = inner.indexOf("{");
    const l = inner.lastIndexOf("}");
    if (f !== -1 && l !== -1 && l > f) return inner.slice(f, l + 1);
    if (f !== -1) return repairTruncatedJSON(inner.slice(f));
    return inner;
  }

  return text.trim();
}

/**
 * 对被 max_tokens 截断的 JSON 做最大努力修复：
 * - 截断字符串值（关闭引号，如果当前在字符串中间）
 * - 补全所有未闭合的 { } [ ] 括号
 * - 目标：让 score / title / niche 等靠前的字段能被 JSON.parse 解析
 */
function repairTruncatedJSON(partial: string): string {
  // 找到最后一个完整的 key:value 对（以 , 或 { 或 [ 结尾的位置）
  // 策略：从末尾往前找最后一个不在字符串里的逗号/花括号，然后截断到那里
  let inString = false;
  let escape = false;
  const stack: string[] = []; // track { and [
  let lastSafePos = 0; // 最后一个完整 token 后的位置

  for (let i = 0; i < partial.length; i++) {
    const ch = partial[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') {
      inString = !inString;
      if (!inString) lastSafePos = i + 1; // 字符串关闭
      continue;
    }
    if (inString) continue;
    // 非字符串区域
    if (ch === '{') { stack.push('}'); lastSafePos = i + 1; }
    else if (ch === '[') { stack.push(']'); lastSafePos = i + 1; }
    else if (ch === '}') { stack.pop(); lastSafePos = i + 1; }
    else if (ch === ']') { stack.pop(); lastSafePos = i + 1; }
    else if (ch === ',' || ch === ':') { lastSafePos = i + 1; }
  }

  // 从 partial 截到 lastSafePos（避免半个 token）
  let repaired = partial.slice(0, lastSafePos);

  // 如果截断发生在字符串中间，关闭它
  if (inString) {
    repaired += '"';
  }

  // 清理末尾多余的逗号
  repaired = repaired.replace(/,\s*$/, '');

  // 补全所有未闭合的括号
  // 重新扫描 repaired 确定还差什么
  const closeStack: string[] = [];
  let inStr2 = false, esc2 = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (esc2) { esc2 = false; continue; }
    if (ch === '\\' && inStr2) { esc2 = true; continue; }
    if (ch === '"') { inStr2 = !inStr2; continue; }
    if (inStr2) continue;
    if (ch === '{') closeStack.push('}');
    else if (ch === '[') closeStack.push(']');
    else if (ch === '}' || ch === ']') closeStack.pop();
  }

  // 按 LIFO 补全
  repaired += closeStack.reverse().join('');
  return repaired;
}

function resolveProxy(explicit?: string): string | undefined {
  return (
    explicit ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    undefined
  );
}

// ─────────────────────── 客户端 ───────────────────────

export class AIClient {
  readonly provider: Provider;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly maxRetries: number;
  readonly pricing: Record<string, { in: number; out: number }>;

  private _anthropic: Anthropic | null = null;
  private _openai: OpenAI | null = null;
  private _apiKey: string;
  private _baseURL?: string;
  private _proxy?: string;

  constructor(opts: AIClientOptions = {}) {
    this.provider =
      opts.provider ??
      (process.env.AI_PROVIDER as Provider) ??
      "anthropic";
    this._apiKey =
      opts.apiKey ??
      (this.provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY ?? ""
        : process.env.OPENAI_API_KEY ?? "");
    this._baseURL =
      opts.baseURL ??
      (this.provider === "openai"
        ? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
        : undefined);
    this.model =
      opts.model ??
      (this.provider === "anthropic"
        ? process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022"
        : process.env.OPENAI_MODEL ?? "gpt-4o-mini");
    this._proxy = resolveProxy(opts.proxy);
    this.temperature = opts.temperature ?? 0.3;
    this.maxTokens = opts.maxTokens ?? 8192;
    this.maxRetries = opts.maxRetries ?? 4;
    this.pricing = { ...DEFAULT_PRICING, ...(opts.pricing ?? {}) };
  }

  private getProxyAgent() {
    if (!this._proxy) return undefined;
    return new HttpsProxyAgent(this._proxy);
  }

  private getAnthropic(): Anthropic {
    if (!this._anthropic) {
      const agent = this.getProxyAgent();
      this._anthropic = new Anthropic({
        apiKey: this._apiKey,
        ...(agent ? { httpAgent: agent as any } : {}),
      });
    }
    return this._anthropic;
  }

  private getOpenAI(): OpenAI {
    if (!this._openai) {
      const proxy = this._proxy;
      // OpenAI SDK v4 在 Node 里默认用全局 fetch（undici），但它不认 httpAgent。
      // 正确做法：传一个自定义 fetch，把 undici dispatcher 注进去。
      // 这是目前最稳的大陆代理接法（比 https-proxy-agent + node-fetch 少一次协议转换）。
      const customFetch = proxy
        ? ((url: any, init: any) => {
            const dispatcher = new (undici as any).ProxyAgent(proxy);
            return (undici as any).fetch(url, { ...init, dispatcher });
          })
        : undefined;
      this._openai = new OpenAI({
        apiKey: this._apiKey,
        baseURL: this._baseURL,
        ...(customFetch ? { fetch: customFetch as any } : {}),
      });
    }
    return this._openai;
  }

  private priceFor(model: string) {
    return this.pricing[model] ?? UNKNOWN_PRICE;
  }

  /** 429 / 503 / 500 指数退避 */
  private async withRetry<T>(fn: () => Promise<T>, label = "ai"): Promise<T> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (e: any) {
        const status = e?.status ?? e?.response?.status;
        const msg = String(e?.message || e);
        const isRate =
          status === 429 ||
          status === 503 ||
          status === 500 ||
          /429|rate|quota|overload/i.test(msg);
        if (!isRate || i === this.maxRetries - 1) throw e;
        const wait = 1500 * Math.pow(2, i) + Math.floor(Math.random() * 500);
        // eslint-disable-next-line no-console
        console.warn(
          `[ai-core:${label}] retry ${i + 1}/${this.maxRetries - 1} after ${wait}ms (status=${status})`
        );
        await sleep(wait);
      }
    }
    throw new Error("unreachable");
  }

  // ─── 原始文本 ───
  async askText(opts: AskOptions): Promise<AskResult<string>> {
    const temperature = opts.temperature ?? this.temperature;
    const maxTokens = opts.maxTokens ?? this.maxTokens;
    const model = opts.model ?? this.model;

    if (this.provider === "anthropic") {
      const client = this.getAnthropic();
      const resp = await this.withRetry(
        () =>
          client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature,
            system: opts.system,
            messages: [{ role: "user", content: opts.user }],
          }),
        "anthropic.text"
      );
      const raw = resp.content
        .map((c: any) => (c.type === "text" ? c.text : ""))
        .join("\n");
      const p = this.priceFor(model);
      return {
        data: raw,
        raw,
        usage: {
          tokens_in: resp.usage?.input_tokens ?? 0,
          tokens_out: resp.usage?.output_tokens ?? 0,
          cost_usd:
            ((resp.usage?.input_tokens ?? 0) * p.in +
              (resp.usage?.output_tokens ?? 0) * p.out) /
            1_000_000,
          model,
          provider: "anthropic",
        },
      };
    }

    const client = this.getOpenAI();
    const resp = await this.withRetry(
      () =>
        client.chat.completions.create({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
        }),
      "openai.text"
    );
    const raw = resp.choices[0]?.message?.content ?? "";
    const p = this.priceFor(model);
    return {
      data: raw,
      raw,
      usage: {
        tokens_in: resp.usage?.prompt_tokens ?? 0,
        tokens_out: resp.usage?.completion_tokens ?? 0,
        cost_usd:
          ((resp.usage?.prompt_tokens ?? 0) * p.in +
            (resp.usage?.completion_tokens ?? 0) * p.out) /
          1_000_000,
        model,
        provider: "openai",
      },
    };
  }

  // ─── 强制 JSON ───
  async askJSON<T = unknown>(opts: AskOptions): Promise<AskResult<T>> {
    const temperature = opts.temperature ?? this.temperature;
    const maxTokens = opts.maxTokens ?? this.maxTokens;
    const model = opts.model ?? this.model;

    let raw = "";
    let usage: Usage;

    if (this.provider === "anthropic") {
      const client = this.getAnthropic();
      const resp = await this.withRetry(
        () =>
          client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature,
            system: opts.system,
            messages: [{ role: "user", content: opts.user }],
          }),
        "anthropic.json"
      );
      raw = resp.content
        .map((c: any) => (c.type === "text" ? c.text : ""))
        .join("\n");
      const p = this.priceFor(model);
      usage = {
        tokens_in: resp.usage?.input_tokens ?? 0,
        tokens_out: resp.usage?.output_tokens ?? 0,
        cost_usd:
          ((resp.usage?.input_tokens ?? 0) * p.in +
            (resp.usage?.output_tokens ?? 0) * p.out) /
          1_000_000,
        model,
        provider: "anthropic",
      };
    } else {
      const client = this.getOpenAI();
      // Provider 自动识别（按 baseURL 或 model 名）
      const isGemini = /gemini/i.test(model);
      // DeepSeek 识别：base_url 含 deepseek 或模型名以 deepseek- 开头
      const isDeepSeek =
        /deepseek/i.test(model) ||
        /deepseek\.com/i.test(this._baseURL ?? "");
      // 红线 1：Gemini 2.5-* 默认开 thinking，会把 max_tokens 吃光，必须关
      const isGeminiWithThinking = /gemini-2\.5/i.test(model);
      // DeepSeek V4 也有 thinking，用 thinking:{type:"disabled"} 关（不同于 Gemini）
      const isDeepSeekWithThinking =
        isDeepSeek && /v4|reasoner/i.test(model);

      // 这些端点对 response_format: json_object 不稳定 → 改用 prompt 指令
      const skipResponseFormat = isGemini;

      const jsonInstruction =
        "\n\nCRITICAL OUTPUT RULES:\n1. Your ENTIRE response must be exactly one JSON object starting with { and ending with }.\n2. Do NOT wrap it in ```json fences.\n3. Do NOT write any prose before or after.\n4. Inside string values, if you include code, properly escape newlines as \\n and double-quotes as \\\".";

      const payload: any = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content:
              opts.system +
              (isGemini || isDeepSeek ? jsonInstruction : ""),
          },
          { role: "user", content: opts.user },
        ],
      };
      if (!skipResponseFormat) payload.response_format = { type: "json_object" };
      // 关掉 Gemini 2.5 的 thinking
      if (isGeminiWithThinking) payload.reasoning_effort = "none";
      // 关掉 DeepSeek V4 的 thinking（不走 reasoning_effort，走专用字段）
      if (isDeepSeekWithThinking) payload.thinking = { type: "disabled" };

      const label = isDeepSeek
        ? "deepseek.json"
        : isGemini
        ? "gemini.json"
        : "openai.json";

      const resp = await this.withRetry(
        () => client.chat.completions.create(payload),
        label
      );
      raw = resp.choices[0]?.message?.content ?? "";
      const p = this.priceFor(model);
      usage = {
        tokens_in: resp.usage?.prompt_tokens ?? 0,
        tokens_out: resp.usage?.completion_tokens ?? 0,
        cost_usd:
          ((resp.usage?.prompt_tokens ?? 0) * p.in +
            (resp.usage?.completion_tokens ?? 0) * p.out) /
          1_000_000,
        model,
        provider: "openai",
      };
    }

    const json = extractJSON(raw);
    try {
      return { data: JSON.parse(json) as T, raw, usage };
    } catch {
      throw new Error(
        `[ai-core] AI 返回内容无法解析为 JSON：\n---RAW---\n${raw.slice(0, 2000)}\n---END---`
      );
    }
  }
}

// ─────────────────────── 全局默认客户端 + 便捷函数 ───────────────────────

let _default: AIClient | null = null;
const _named: Record<string, AIClient> = {};

/** 按 process.env 创建（或复用）一个默认客户端 */
export function getDefaultClient(): AIClient {
  if (!_default) _default = new AIClient();
  return _default;
}

/** 重置默认客户端（热切换 env 时用） */
export function resetDefaultClient() {
  _default = null;
  for (const k of Object.keys(_named)) delete _named[k];
}

/** 工厂：显式配置 */
export function createAIClient(opts: AIClientOptions = {}): AIClient {
  return new AIClient(opts);
}

/**
 * 命名客户端：同一进程里共存多个 provider
 * 用法：
 *   registerClient("heavy", { provider: "openai", apiKey: "sk-...", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash" });
 *   registerClient("cheap", { provider: "openai", apiKey: "AIza...", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash-lite" });
 *   await getClient("heavy").askJSON(...)
 *
 * 也支持按 env 自动注册（见 autoRegisterFromEnv）。
 */
export function registerClient(name: string, opts: AIClientOptions): AIClient {
  const c = new AIClient(opts);
  _named[name] = c;
  return c;
}

export function getClient(name?: string): AIClient {
  if (!name) return getDefaultClient();
  const c = _named[name];
  if (c) return c;
  // 名字没注册过 → 回退到默认
  return getDefaultClient();
}

export function listClients(): string[] {
  return Object.keys(_named);
}

/**
 * 按约定 env 变量自动注册一组命名客户端：
 *
 *   AI_<NAME>_PROVIDER      anthropic / openai
 *   AI_<NAME>_API_KEY
 *   AI_<NAME>_BASE_URL      可选（仅 openai）
 *   AI_<NAME>_MODEL
 *
 * 例：
 *   AI_HEAVY_PROVIDER=openai
 *   AI_HEAVY_API_KEY=sk-...
 *   AI_HEAVY_BASE_URL=https://api.deepseek.com
 *   AI_HEAVY_MODEL=deepseek-v4-flash
 *
 *   AI_CHEAP_PROVIDER=openai
 *   AI_CHEAP_API_KEY=AIza...
 *   AI_CHEAP_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
 *   AI_CHEAP_MODEL=gemini-2.5-flash-lite
 */
export function autoRegisterFromEnv(): string[] {
  const registered: string[] = [];
  const pattern = /^AI_([A-Z0-9_]+)_PROVIDER$/;
  for (const key of Object.keys(process.env)) {
    const m = key.match(pattern);
    if (!m) continue;
    const NAME = m[1];
    const lower = NAME.toLowerCase();
    // 保留字段跳过
    if (lower === "provider") continue;
    const provider = process.env[`AI_${NAME}_PROVIDER`] as Provider;
    const apiKey = process.env[`AI_${NAME}_API_KEY`];
    const baseURL = process.env[`AI_${NAME}_BASE_URL`];
    const model = process.env[`AI_${NAME}_MODEL`];
    if (!apiKey || !model) continue;
    registerClient(lower, { provider, apiKey, baseURL, model });
    registered.push(lower);
  }
  return registered;
}

/** 便捷：用默认客户端问一段文本 */
export function askText(opts: AskOptions) {
  return getDefaultClient().askText(opts);
}

/** 便捷：用默认客户端问一个 JSON */
export function askJSON<T = unknown>(opts: AskOptions) {
  return getDefaultClient().askJSON<T>(opts);
}

/** 便捷：当前默认 provider */
export function currentProvider(): Provider {
  return getDefaultClient().provider;
}

// ─────────────────────── Embedding ───────────────────────

export interface EmbedOptions {
  texts: string[];
  model?: string;
  apiKey?: string;
  baseURL?: string;
  /** "gemini" | "openai"（对应的 embedding 端点）；不传则按 baseURL/model 自动识别 */
  provider?: "gemini" | "openai";
}

export interface EmbedResult {
  embeddings: number[][];
  model: string;
  tokens: number;
  cost_usd: number;
}

const EMBED_PRICING: Record<string, { per_1m: number }> = {
  "text-embedding-3-small": { per_1m: 0.02 },
  "text-embedding-3-large": { per_1m: 0.13 },
  "gemini-embedding-001": { per_1m: 0 }, // 免费档
  "text-embedding-004": { per_1m: 0 },
  "embedding-001": { per_1m: 0 },
};

/**
 * 批量计算 embedding。自动识别 Gemini / OpenAI 端点。
 * Gemini 的 embedContent 端点走原生 REST，不走 OpenAI-compat（compat 模式不支持 embedding）。
 */
export async function embed(opts: EmbedOptions): Promise<EmbedResult> {
  const apiKey =
    opts.apiKey ??
    process.env.EMBED_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "";
  const baseURL = opts.baseURL ?? process.env.EMBED_BASE_URL;
  const model = opts.model ?? process.env.EMBED_MODEL ?? "gemini-embedding-001";
  const provider =
    opts.provider ??
    (/gemini|googleapi/i.test(baseURL ?? "") || /^gemini|embedding-001|text-embedding-004/i.test(model)
      ? "gemini"
      : "openai");

  if (provider === "gemini") {
    // Gemini 原生 REST embedContent（OpenAI-compat 模式不支持 embedding）
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;
    const body = {
      requests: opts.texts.map((t) => ({
        model: `models/${model}`,
        content: { parts: [{ text: t }] },
      })),
    };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(
        `[ai-core.embed] Gemini ${res.status}: ${await res.text()}`
      );
    }
    const j: any = await res.json();
    const embeddings: number[][] = (j.embeddings ?? []).map((e: any) => e.values ?? []);
    if (embeddings.length !== opts.texts.length) {
      throw new Error(
        `[ai-core.embed] Gemini 返回 ${embeddings.length} 条，但请求了 ${opts.texts.length} 条`
      );
    }
    const tokens = opts.texts.reduce((a, t) => a + Math.ceil(t.length / 4), 0);
    return { embeddings, model, tokens, cost_usd: 0 };
  }

  // OpenAI / 兼容
  const url = `${baseURL ?? "https://api.openai.com/v1"}/embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: opts.texts }),
  });
  if (!res.ok) {
    throw new Error(
      `[ai-core.embed] OpenAI ${res.status}: ${await res.text()}`
    );
  }
  const j: any = await res.json();
  const embeddings = (j.data ?? [])
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: any) => d.embedding as number[]);
  const tokens = j.usage?.total_tokens ?? 0;
  const price = EMBED_PRICING[model]?.per_1m ?? 0;
  const cost_usd = (tokens * price) / 1_000_000;
  return { embeddings, model, tokens, cost_usd };
}

/** 工具：余弦相似度 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
