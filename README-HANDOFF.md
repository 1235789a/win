# AI 创业情报系统 — 交接包

> 打包时间：2026-05-11
> 交付形式：本地可跑 Next.js 项目（Windows 11 / Node 20+ 已验证）
> 上一任：Cline
> 交付目标：下一个 agent 读完这 8 份 md + 跑完 04-SETUP，就能无缝接手。

---

## 这是什么

一个**本地优先**的情报系统，干一件事：

> 读一条 Reddit / HN / 推文 / 论坛帖，
> 判断里面有没有藏着一个"开发一次、无限复卖、零客服"的微型 SaaS 机会，
> 如果有，**直接给出一份第二天就能开写的技术蓝图**。

不是新闻聚合器，不是摘要工具。是"痛点 → 可落地产品 brief"的转换管线。

---

## 现在能干嘛（MVP 阶段已完成）

- 🟢 贴一段文本 / URL → 自动清洗 → AI 分析 → 得分 + 9000 字级技术蓝图
- 🟢 Self-consistency（同题多温度跑 N 次取中位数分）
- 🟢 SQLite 持久化 + Dashboard 列表 + 详情页
- 🟢 Gemini / Claude / OpenAI 统一接入（换 provider 改 env 即可）
- 🟢 大陆代理自动穿透（`HTTPS_PROXY`）
- 🟢 成本统计（tokens_in/out + cost_usd 每次都落库）
- 🟢 一键启动 `.bat`（start.bat / stop.bat / install-shortcut.bat）

**实测样例**：`samples/latest-brief-upwork.md`（Upwork 提案筛选痛点 → 得分 90 → 9800 字 blueprint，含真实 TypeScript 核心算法）

---

## 马上要读的 8 份文档（按顺序）

| # | 文件 | 干啥的 |
|---|---|---|
| 0 | [`00-OVERVIEW.md`](./00-OVERVIEW.md) | 产品定位 + 用户画像 + 核心判断框架 |
| 1 | [`01-ARCHITECTURE.md`](./01-ARCHITECTURE.md) | 系统架构 + 数据流 + 目录树 |
| 2 | [`02-FEATURES.md`](./02-FEATURES.md) | 已实现 vs 未实现功能清单 |
| 3 | [`03-CODE-MAP.md`](./03-CODE-MAP.md) | 每个源码文件的作用 + 关键函数 |
| 4 | [`04-SETUP.md`](./04-SETUP.md) | 从零跑起来的完整步骤 |
| 5 | [`05-KNOWN-ISSUES.md`](./05-KNOWN-ISSUES.md) | 已踩的坑 + 避雷指南 |
| 6 | [`06-ROADMAP.md`](./06-ROADMAP.md) | 下阶段功能路线 |
| 7 | [`07-PROMPT-DESIGN.md`](./07-PROMPT-DESIGN.md) | prompt 设计哲学 + 3 次迭代记录 |

---

## 源码位置

```
code/
├── ai-intel/          主项目（Next.js 14 App Router）
└── packages/
    └── ai-core/       可复用 AI 调用模块（@mi/ai-core）
db-snapshot/
└── intel.db           7 条实测机会（可直接打开）
samples/
└── latest-brief-upwork.md    Upwork 痛点实测产出
```

---

## 最快验证交付是否可用

```powershell
cd D:\handoff\ai-intel-handoff-20260511\code\ai-intel
npm install
npm run dev
# 另开一个终端（需要代理开着）：
node scripts/test-one.mjs
```

看到 `HTTP 200 ... score: 90 ... blueprint: 9800+ chars` 就说明整条管线 OK。

详细步骤看 [`04-SETUP.md`](./04-SETUP.md)。

---

## 交接人留言

最主要的心智负担是两条：

1. **prompt 是这个系统的命门**，不是代码。勿动 `src/lib/prompts.ts` 里的禁词黑名单和章节结构，否则立刻退化成"通用 SaaS 模板"废话。见 `07-PROMPT-DESIGN.md`。

2. **Gemini 2.5 有 thinking 陷阱**。用 2.5-flash 必须传 `reasoning_effort:"none"`，否则 token 预算会被 thinking 全吃光只吐半截 JSON。`packages/ai-core` 已经处理。见 `05-KNOWN-ISSUES.md`。

其它都是常规 Next.js 活，不复杂。
