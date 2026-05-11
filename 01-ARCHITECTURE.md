# 01 · 系统架构

## 一张图看懂

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Dashboard)                          │
│  /analyze · /opportunities · / (home)                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ fetch
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 14 App Router (Node runtime)                │
│                                                                  │
│  POST /api/analyze       ← 核心管线入口                           │
│    1. 读 text 或 url                                             │
│    2. fetchURL (Reddit/HN/PH/通用) → 提取正文                    │
│    3. cleanText  → 去广告 / 去 markdown 噪声                     │
│    4. askJSON × N  (Self-consistency 并行 N 次)                  │
│    5. 分数取中位数 → 最接近中位数的那条作为正文                   │
│    6. clampScore + scoreToPriority                               │
│    7. insertOpportunity → SQLite                                 │
│    8. 返回 { analysis, usage, saved_id }                         │
│                                                                  │
│  POST /api/fetch-url     ← 只抓不分析（调试用）                   │
│  POST /api/deep-process  ← 深度加工（尚未接入 v4 prompt，TODO）   │
│  GET  /api/opportunities ← 列表 + 筛选                           │
│  GET  /api/stats         ← 聚合统计                              │
└────────────┬────────────────────────────────────────────────────┘
             │                                  │
             ▼                                  ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  @mi/ai-core              │    │  better-sqlite3                 │
│  (file: 本地依赖)         │    │  data/intel.db                  │
│                           │    │  - opportunities 表             │
│  - AIClient 类            │    │  - 14 列: id / source_* /       │
│  - askJSON / askText      │    │    analysis_json / tokens_*     │
│  - 代理：undici ProxyAgent│    └─────────────────────────────────┘
│  - 429/500/503 指数退避   │
│  - Gemini 2.5 自动关      │
│    thinking               │
└────────┬──────────────────┘
         │ HTTPS (via proxy)
         ▼
┌──────────────────────────────────────────────────────────────────┐
│     Gemini OpenAI-compat     │     Anthropic Claude              │
│  generativelanguage.google...│  api.anthropic.com                │
│     (默认 / 免费)             │  (备用 / 付费)                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 技术栈

| 层 | 选择 | 为什么 |
|---|---|---|
| 前端框架 | Next.js 14 App Router | SSR 快、API 与页面同仓库、文件即路由 |
| UI | Tailwind + shadcn/ui | 极简黑白灰、原子类好改 |
| 后端 | Next.js Route Handlers (Node runtime) | 一个进程搞定前后端 |
| DB | better-sqlite3 | 零依赖、单文件、本地优先完美匹配 |
| AI | Gemini 2.5 flash-lite（默认） + Claude / OpenAI 兼容 | 免费额度够 MVP，成本 $0 |
| 代理 | undici ProxyAgent（注入 OpenAI SDK 的 fetch） | 大陆必备，见 05 知坑 |
| AI 模块 | `@mi/ai-core`（本地 file: 依赖） | 可被任何 Node 项目复用 |

---

## 目录树（源码）

```
code/
├── ai-intel/                       ← Next.js 主应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          根布局（sidebar + 字体）
│   │   │   ├── page.tsx            首页（简介 + 统计）
│   │   │   ├── globals.css         Tailwind + theme
│   │   │   ├── analyze/
│   │   │   │   └── page.tsx        贴文本 / URL 分析表单
│   │   │   ├── opportunities/
│   │   │   │   └── page.tsx        机会列表（含筛选、排序）
│   │   │   └── api/
│   │   │       ├── analyze/route.ts       ★ 核心管线
│   │   │       ├── fetch-url/route.ts     单纯抓 URL
│   │   │       ├── opportunities/route.ts 列表 API
│   │   │       ├── stats/route.ts         聚合统计
│   │   │       └── deep-process/route.ts  二次加工（尚未用新 prompt）
│   │   ├── components/
│   │   │   ├── analyze-form.tsx    analyze 页主表单
│   │   │   ├── blueprint-view.tsx  详情页 blueprint 渲染
│   │   │   ├── opportunity-card.tsx 列表卡片
│   │   │   ├── score-bar.tsx       分数条
│   │   │   ├── sidebar.tsx         左侧导航
│   │   │   └── ui/                 shadcn 组件（button/input/card/badge/textarea）
│   │   └── lib/
│   │       ├── ai.ts               ★ 薄壳，转发到 @mi/ai-core
│   │       ├── cleaner.ts          文本清洗（去广告、去 markdown 样式）
│   │       ├── fetcher.ts          URL 抓取（Reddit JSON / HN API / PH / 通用 readability）
│   │       ├── prompts.ts          ★★★ v4 prompt（命门，见 07）
│   │       ├── deep-prompts.ts     深度加工 prompt（旧版，可重写）
│   │       ├── scorer.ts           clampScore + scoreToPriority
│   │       ├── db.ts               better-sqlite3 初始化 + CRUD
│   │       ├── types.ts            Opportunity / AnalysisResult 等
│   │       └── utils.ts            cn (tailwind class merge)
│   ├── scripts/
│   │   ├── test-one.mjs            ★ 冒烟测（Upwork 样例）
│   │   ├── dump-one.mjs            从 DB 回读最新一条写 md
│   │   ├── probe-proxy.mjs         代理连通性探测
│   │   ├── probe-long.mjs          长 prompt + thinking 测试
│   │   ├── cheap_harvester.ts      批量采集（legacy，待重构）
│   │   ├── hyper_harvester.ts      多 agent 采集（legacy）
│   │   └── install-shortcut.ps1    桌面快捷方式
│   ├── data/                       SQLite 与 run 目录（.gitignore 内）
│   ├── .env.local                  ★ 真实 API key 在这里
│   ├── .env.local.example          模板
│   ├── next.config.mjs             transpilePackages 指向 @mi/ai-core
│   ├── package.json                依赖含 @mi/ai-core file:../packages/ai-core
│   ├── start.bat                   启动器
│   └── stop.bat                    关停
└── packages/
    └── ai-core/                    ← @mi/ai-core 可复用模块
        ├── src/
        │   └── index.ts            ★ AIClient 全部实现
        ├── package.json            依赖：openai, @anthropic-ai/sdk, undici, https-proxy-agent
        ├── tsconfig.json
        └── README.md
```

---

## 数据流示例：贴一段 Reddit 文本

```
User 粘贴 Upwork 抱怨到 /analyze 页
        │
        ▼
/api/analyze (POST)
  body = { text, platform: "reddit", save: true, n: 1 }
        │
        ▼
cleanText(text)  → 去掉行首 "> "、多余换行
        │
        ▼
Promise.all([
  askJSON({ system: SYSTEM_PROMPT, user: ANALYSIS_USER_PROMPT({...}), temperature: 0.2 })
  // n>1 时还有 0.5, 0.8, ...
])
        │
        ▼ 每次调用内部
@mi/ai-core AIClient.askJSON
  → 自动加 reasoning_effort:"none"（gemini-2.5-*）
  → 自动加 JSON-only system 指令（gemini）
  → withRetry × 4 (429/500/503 退避)
  → 用 undici ProxyAgent 走 HTTPS_PROXY
        │
        ▼
Gemini OpenAI-compat 返回 JSON 字符串
        │
        ▼
extractJSON() 抽出 { ... } 主体 → JSON.parse
        │
        ▼ 回到 route.ts
scores = runs.map(r => clampScore(r.data.score))
finalScore = median(scores)
picked = 最接近中位数的那条
        │
        ▼
insertOpportunity({
  source_platform, raw_text, title, target_niche, pain_point_analysis,
  score, priority, tags, blueprint, has_blueprint,
  tokens_in, tokens_out, cost_usd, ...
})
        │
        ▼
return NextResponse.json({ analysis, usage, saved_id })
        │
        ▼
前端展示：得分 + 蓝图 markdown 渲染
```

---

## 关键设计决策

### 1. 为什么用 SQLite 而不是 Supabase？
本地优先 = 无网也能读旧数据 = 隐私高 = 可随时 fork 成多实例。Supabase 留到多人协作阶段再上。

### 2. 为什么 AI 模块独立成 `@mi/ai-core`？
- 下一个你写的小产品（landing page / sub-agent / cron harvester）大概率也要调 AI + 走代理 + 处理 Gemini thinking
- 复制一份就同步两处很痛
- 抽成 package 后一次修复，所有项目受益
- 未来想上 npm 发布（私有仓或开源）零改动

### 3. 为什么 Self-consistency 默认 N=1？
- N=3/5 能减少 score 抖动，但成本 × N
- Gemini 免费档每分钟 10-30 请求，一次并发 3 容易撞限额
- MVP 阶段单次已经够用，等付费用模型再上 N=3

### 4. 为什么 blueprint 放在 score ≥ 80 才生成？
- blueprint 占输出 80% 的 token
- 如果痛点本身就没价值，写再漂亮的蓝图都是浪费
- prompt 里硬性规定 score < 80 → blueprint = ""（model 自己会省）

---

## 路由清单

| 路径 | 方法 | 作用 | 状态 |
|---|---|---|---|
| `/` | GET | 首页（stats 面板） | ✅ |
| `/analyze` | GET | 分析表单页 | ✅ |
| `/opportunities` | GET | 机会列表 | ✅ |
| `/api/analyze` | POST | 核心管线 | ✅ |
| `/api/fetch-url` | POST | 仅抓 URL | ✅ |
| `/api/opportunities` | GET | 列表 + 筛选 | ✅ |
| `/api/stats` | GET | 聚合统计 | ✅ |
| `/api/deep-process` | POST | 二次加工（用旧 prompt） | ⚠️ 待升级到 v4 |
| 机会详情页 | - | 点列表进详情 | ⚠️ 未实现（现在只在列表卡片里展开） |

---

## 依赖清单（节选）

**ai-intel/package.json**:
- next@14
- react@18
- tailwindcss@3
- better-sqlite3@11
- @mi/ai-core (file:../packages/ai-core)
- lucide-react

**packages/ai-core/package.json**:
- openai@^4.67
- @anthropic-ai/sdk@^0.27
- undici@^6  ← 走代理的关键
- https-proxy-agent@^7  ← Anthropic SDK 还在用
