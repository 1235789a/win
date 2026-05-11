# 03 · 源码地图

> 快速定位："我想改 X 应该看哪个文件？"

---

## ⭐ 三个核心文件（90% 修改集中在这里）

### 1. `code/ai-intel/src/lib/prompts.ts`
**是什么：** v4 prompt 定义。SYSTEM_PROMPT + ANALYSIS_USER_PROMPT。
**改它会怎样：** 直接影响 blueprint 风格和质量。**改之前先读 `07-PROMPT-DESIGN.md`**。

### 2. `code/ai-intel/src/app/api/analyze/route.ts`
**是什么：** 主管线。接收 text/url → 清洗 → askJSON × N → 打分 → 落库。
**关键参数：**
- `maxTokens: 16384` —— Gemini 2.5 对大型 JSON 响应需要这个值
- `temps = [0.2, 0.5, 0.8, 0.35, 0.65]` —— Self-consistency 用的温度序列
- `finalScore = median(scores)` —— 取中位数而不是平均，抗离群值

### 3. `code/packages/ai-core/src/index.ts`
**是什么：** AI 调用的"物理层"。provider 切换、代理、重试、JSON 提取全在这。
**关键点：**
- `getOpenAI()` 里用 undici ProxyAgent 注入 fetch
- `askJSON()` 里 `isGeminiWithThinking` 判断自动加 `reasoning_effort:"none"`
- `extractJSON()` 处理 Gemini 经常出现的 ```json 围栏、裸对象、嵌套代码块

---

## ai-intel/src 全文件地图

### `app/` 页面

| 文件 | 作用 | 依赖 |
|---|---|---|
| `layout.tsx` | 根布局，sidebar + 字体 | `components/sidebar.tsx` |
| `page.tsx` | 首页，统计仪表盘 | fetch `/api/stats` |
| `analyze/page.tsx` | 分析表单页 | `components/analyze-form.tsx` |
| `opportunities/page.tsx` | 机会列表 | fetch `/api/opportunities` + `opportunity-card.tsx` |
| `globals.css` | Tailwind base + shadcn theme vars | |

### `app/api/` Route Handlers

| 文件 | 方法 | 用途 |
|---|---|---|
| `analyze/route.ts` | POST | 核心管线（详见上面） |
| `fetch-url/route.ts` | POST | 只跑 `fetchURL`，不调 AI，调试用 |
| `opportunities/route.ts` | GET | 列表 + query string 过滤 |
| `stats/route.ts` | GET | 聚合：总数、平均分、今日/本周成本 |
| `deep-process/route.ts` | POST | 对已有 opportunity 再跑一轮深度分析（**仍用旧 deep-prompts，需要升级**）|

### `components/` 组件

| 文件 | 作用 |
|---|---|
| `analyze-form.tsx` | /analyze 页主表单：text/url 切换、N 滑块、提交 |
| `blueprint-view.tsx` | blueprint markdown 渲染（带代码块高亮） |
| `opportunity-card.tsx` | 列表卡片：标题+niche+tags+分数条+展开 |
| `score-bar.tsx` | 水平分数条（0-100） |
| `sidebar.tsx` | 左侧导航 |
| `ui/button.tsx` · `card.tsx` · `badge.tsx` · `input.tsx` · `textarea.tsx` | shadcn 基础件 |

### `lib/` 业务逻辑

| 文件 | 关键导出 | 作用 |
|---|---|---|
| `ai.ts` | `askJSON` | 薄壳，re-export 自 `@mi/ai-core` |
| `cleaner.ts` | `cleanText(raw)` | 去广告行、去 markdown 符号、归一空白 |
| `fetcher.ts` | `fetchURL(url)` · `detectPlatform(url)` | 根据域名分流到 Reddit JSON API / HN Firebase / PH oEmbed / 通用 readability |
| `prompts.ts` | `SYSTEM_PROMPT` · `ANALYSIS_USER_PROMPT()` | v4 prompt |
| `deep-prompts.ts` | `DEEP_SYSTEM` · `DEEP_USER()` | 旧的二次加工 prompt（**建议重写**）|
| `scorer.ts` | `clampScore(n)` · `scoreToPriority(n)` | 0-100 钳位 + S/A/B/C 分级 |
| `db.ts` | `getDB()` · `insertOpportunity()` · `listOpportunities()` · `getStats()` | better-sqlite3 封装 |
| `types.ts` | `Opportunity` · `AnalysisResult` · `SourcePlatform` | 统一类型 |
| `utils.ts` | `cn()` | `clsx + tailwind-merge` |

### `scripts/` 工具脚本

| 文件 | 用途 | 常用度 |
|---|---|---|
| `test-one.mjs` | 用 Upwork 痛点打一次 /api/analyze 看效果 | ⭐⭐⭐ |
| `dump-one.mjs` | 从 DB 读最新一条写到 `data/latest-brief.md` | ⭐⭐⭐ |
| `probe-proxy.mjs` | 测代理通不通 + 两种 agent 方式对比 | ⭐⭐ |
| `probe-long.mjs` | 测 Gemini 2.5 的 thinking 行为 | ⭐ |
| `probe-gemini.mjs` | 老的 Gemini 探测（可删） | - |
| `test-3-pains.mjs` | 批量跑 3 个痛点对比（可用于 prompt 回归测试） | ⭐⭐ |
| `cheap_harvester.ts` / `hyper_harvester.ts` / `dump_pains.ts` | 老版批量采集，待重构 | - |
| `install-shortcut.ps1` | 桌面快捷方式 | - |

---

## 数据表

**`opportunities`** (SQLite, WAL 模式)

| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| created_at | TEXT | ISO 时间戳，`datetime('now')` |
| source_platform | TEXT | reddit / hackernews / producthunt / twitter / manual |
| source_url | TEXT nullable | |
| raw_text | TEXT | 清洗后的原文（留着追溯） |
| title | TEXT | AI 给的产品名 |
| target_niche | TEXT | 子行业 + 地域 |
| pain_point_analysis | TEXT | 300+ 字深度分析 |
| build_once_sell_infinite | INTEGER (0/1) | |
| score | INTEGER | 0-100 |
| priority | TEXT | S / A / B / C |
| tags | TEXT | 逗号分隔 |
| blueprint | TEXT | score≥80 才有 |
| has_blueprint | INTEGER (0/1) | |
| analysis_json | TEXT | 原始 AI JSON + scores 数组 |
| tokens_in | INTEGER | |
| tokens_out | INTEGER | |
| cost_usd | REAL | |
| favorite | INTEGER (0/1) | 前端未连通 |

索引：`idx_score` `idx_created_at`

---

## 环境变量

| Key | 必填 | 默认 | 说明 |
|---|---|---|---|
| `AI_PROVIDER` | ✅ | `anthropic` | `openai` 或 `anthropic` |
| `OPENAI_API_KEY` | 当 provider=openai | - | Gemini AI Studio key 也填这里 |
| `OPENAI_BASE_URL` | 当用 Gemini | `https://api.openai.com/v1` | Gemini = `https://generativelanguage.googleapis.com/v1beta/openai/` |
| `OPENAI_MODEL` | ✅ | `gpt-4o-mini` | 当前 `gemini-2.5-flash-lite` |
| `ANTHROPIC_API_KEY` | 当 provider=anthropic | - | |
| `ANTHROPIC_MODEL` | - | `claude-3-5-sonnet-20241022` | |
| `HTTPS_PROXY` | 大陆必填 | - | `http://127.0.0.1:7890` |
| `HTTP_PROXY` | - | 同上 | |
| `DB_PATH` | - | `./data/intel.db` | SQLite 文件位置 |
