# AI 创业情报系统 · v2（冷酷架构师模式）

本地优先的需求发现系统。把任何一段 Reddit / X / HN / Product Hunt / 微信群聊 的内容扔进去，由**顶尖全栈架构师 + 商业分析师人格**（受众：海外华人企业 / 工作室）判断：

- 这是不是一个「**开发一次、无限复卖、零客服**」的微型 SaaS / Agent 机会
- `score`（0-100）值不值得做
- `target_niche` 具体落到哪类海外华人业务（东南亚 Shopee / 北美代写 / 欧洲代购 / 华人 Indie Hacker 等）
- `score ≥ 80` 时直接产出 **≥800 字中文技术落地蓝图**（含代码片段、表结构、License、试用、冷启动）

这不是新闻聚合、不是摘要器，只关心"这里有没有可复卖的机会"。

---

## 快速开始

```bash
cd ai-intel
npm install
cp .env.local.example .env.local    # 填入 ANTHROPIC_API_KEY
npm run dev
```

打开 http://localhost:3000

### 环境变量

```
AI_PROVIDER=anthropic              # anthropic | openai
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-20250514

# 或 OpenAI 兼容：
# AI_PROVIDER=openai
# OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-4o
# OPENAI_BASE_URL=https://api.openai.com/v1
```

数据库：本地 SQLite，默认 `./data/intel.db`，首次自动建表；老 schema 会被自动改名备份成 `intel.v1-<ts>.db`。

---

## 系统人格与合规尺度（重要）

- 所有「防注入 / 防逆向 / 防滥用」指**保护你自己的 SaaS**（Prompt 注入防御、License 签名、限流、混淆、水印、试用墙）。
- 严禁输出绕过第三方平台风控 / 破解他人系统的方案。AI 在遇到此类输入会打低分并标注「灰产陷阱」。
- 目标画像是**海外华人企业/工作室**，`target_niche` 必须具体到子行业 + 地域。

详见 `src/lib/prompts.ts`。修改人格 / 画像库 / 蓝图结构就改这一个文件。

---

## 数据契约

`AnalysisResult`（`src/lib/types.ts`）：

```ts
interface AnalysisResult {
  title: string;                     // 8-20 字机会名
  target_niche: string;              // 具体海外华人细分
  pain_point_analysis: string;       // ≥300 字深度分析
  build_once_sell_infinite: boolean; // 复卖零客服命中
  score: number;                     // 0-100
  tags: string[];
  blueprint: string;                 // ≥800 字 markdown；score<80 为 ""
}
```

所有 API、DB、UI 围绕这份契约。改 Schema 从这里开始。

---

## 目录结构

```
src/
  lib/
    prompts.ts        # 冷酷架构师 system prompt + 画像库 + 蓝图骨架（单一真相源）
    types.ts          # AnalysisResult / Opportunity / Priority
    scorer.ts         # clampScore + scoreToPriority（AI 直出分，本文件仅分桶）
    db.ts             # SQLite 持久层 + 自动迁移（旧 schema 自动备份）
    ai.ts             # askJSON：Claude / OpenAI 双通道统一入口
    cleaner.ts        # 广告 / 空白 / URL 清洗
    fetcher.ts        # Reddit / HN / 通用 URL 抓取
    utils.ts          # cn / truncate / formatDate
  app/
    api/
      analyze/        # POST: input → AI → save → analysis
      opportunities/  # GET 列表 / PATCH 收藏 / DELETE
      fetch-url/      # POST: URL → 正文
      stats/          # GET: Dashboard 聚合
    page.tsx          # Dashboard
    analyze/          # 输入分析页
    opportunities/    # 列表 + 筛选
    layout.tsx
  components/
    blueprint-view.tsx   # Markdown 渲染 + 一键复制
    opportunity-card.tsx # 卡片：score / niche / 蓝图折叠
    analyze-form.tsx
    sidebar.tsx
    ui/ (button / card / badge / input / textarea)
```

---

## 评分与优先级

- AI 直接给 `score`，本地只 clamp 到 0-100。
- 分桶：`≥80 → P0`、`≥60 → P1`、`≥40 → P2`、否则 `P3`。
- `has_blueprint = 1` 的硬条件：`score ≥ 80` 且 blueprint 文本 > 200 字符。
- Dashboard 顶部「**Can-Ship（可交付）**」= 同时满足 `score≥80 AND has_blueprint=1` 的机会总数，这是唯一真正值得看的指标。

---

## 第二阶段扩展（已预留抽象）

- **自动抓取**：`fetcher.ts` 已封装平台识别，加 cron（如 `node-cron` 或 Vercel Cron）直接调 `/api/analyze`
- **向量去重**：`analysis_json` 原样存着，接 pgvector / Chroma 嵌入 `title + pain_point_analysis` 做相似度
- **多 Agent 协作**：`prompts.ts` 拆成 `discovery / validator / architect` 三个 prompt，`ai.ts` 串行调用
- **自动日报**：新增 `/api/digest` 读 `getStats()` 过去 24h + top P0 喂给 AI 生成 markdown
- **自动 Landing Page / SEO 文 / 社媒帖**：已有 blueprint 作为素材源，加 `/api/ship?id=` 流水线

---

## 开发原则

- 单一真相源：Schema 定义在 `types.ts`，prompt 契约在 `prompts.ts`，改一处全链路对齐。
- 不做复杂权限 / 支付 / 社交 / 云同步。MVP 只做「需求发现闭环」。
- AI 输出无论怎么歪都要 clamp 兜底（见 `scorer.clampScore` 和 `analyze/route` 里的 safeTags）。
- `maxTokens: 16000` 是有意为之，蓝图要算力够，不省 Token。
