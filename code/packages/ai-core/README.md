# @mi/ai-core

本地通用 AI 模块。`ai-intel`、`landing-page` 或任何新项目都能通过 `file:` 依赖直接 import，零发布、零安装、改一处全生效。

## 能力

- **三厂商统一**：Anthropic Claude / OpenAI / Gemini（走 OpenAI-compat 端点）
- **大陆代理**：自动读 `HTTPS_PROXY` / `HTTP_PROXY`，SDK 层注入
- **429 / 5xx 自动退避重试**（默认 4 次）
- **Gemini 兼容性**：自动去 `response_format`，自动加 JSON-only 指令，`extractJSON` 能吃下嵌套 ```sql 围栏
- **成本统计**：返回体带 `usage.cost_usd`，内置价格表（2025 主流模型）

## 在新项目里接入（三步）

```bash
# 1. 在你项目的 package.json 加一行
"@mi/ai-core": "file:../packages/ai-core"

# 2. Next.js 项目需要把它加到 transpilePackages（因为我们直接发 TS 源码）
# next.config.mjs:
export default { transpilePackages: ["@mi/ai-core"] }

# 3. 装依赖
npm install
```

## 用法

```ts
import { askJSON } from "@mi/ai-core";

const { data, usage } = await askJSON<{ score: number }>({
  system: "Return a JSON object with a score field.",
  user: "How promising is this idea: AI for writing Shopify product descriptions?",
});

console.log(data.score, usage.cost_usd);
```

### 环境变量（默认客户端）

```ini
AI_PROVIDER=openai            # openai | anthropic
OPENAI_API_KEY=AIza...        # Gemini 也用这个字段
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-flash-lite

# 或用 Claude
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

HTTPS_PROXY=http://127.0.0.1:7890
```

### 显式配置（不走 env）

```ts
import { createAIClient } from "@mi/ai-core";

const ai = createAIClient({
  provider: "openai",
  apiKey: process.env.GEMINI_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  model: "gemini-2.5-flash-lite",
  proxy: "http://127.0.0.1:7890",
  maxRetries: 6,
});

const r = await ai.askJSON({ system: "...", user: "..." });
```

## 为什么不发 npm？

- 本地优先、零流水线
- 改一处三个项目马上生效
- 任何时候想发到 npm 只要把 `private: true` 改掉就行
