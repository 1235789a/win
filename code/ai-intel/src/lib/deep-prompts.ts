// 深加工管线 prompts —— 在 analysis 之后按 score 阈值逐级触发
// 每个 prompt 返回纯文本（markdown / html），由调用方写入 artifacts 表 + 磁盘

import type { ArtifactKind, Opportunity } from "./types";

export interface StageSpec {
  kind: ArtifactKind;
  min_score: number;
  format: "md" | "html";
  max_tokens: number;
  system: string;
  user: (opp: Opportunity) => string;
}

const BASE_PERSONA = `你是一名极其冷酷客观的顶尖全栈架构师和商业分析师，服务海外华人企业/工作室。
坚持"开发一次、无限复卖、零客服"原则。
所有安全/License/混淆逻辑必须是保护你自己 SaaS 的合规工程实践，严禁输出任何绕过第三方平台风控、破解他人系统的方案。
`;

function oppContext(o: Opportunity) {
  return `【机会】${o.title}
【细分】${o.target_niche}
【评分】${o.score}
【复卖】${o.build_once_sell_infinite ? "是" : "否"}

【痛点分析】
${o.pain_point_analysis}

【已有蓝图（节选）】
${(o.blueprint || "").slice(0, 3000)}
`;
}

export const STAGES: StageSpec[] = [
  // -------- 60+ --------
  {
    kind: "critique",
    min_score: 60,
    format: "md",
    max_tokens: 4000,
    system:
      BASE_PERSONA +
      `\n你现在是"红队架构师"，任务是把这个机会"打到报废"。必须用最尖锐、最不留情面的语气指出问题，但所有批评必须基于商业与工程事实。`,
    user: (o) => `${oppContext(o)}

输出 Markdown，严格包含以下章节：
## 1. 复卖模型漏洞（指出哪些环节其实需要人工/定制）
## 2. 伪装的需求（用户真正想要的可能不是这个功能）
## 3. 技术栈陷阱（哪些选型会让维护成本爆炸）
## 4. 竞品扼杀风险（谁能 2 周内复制你）
## 5. 获客冷启动断点（为什么海外华人不会来注册）
## 6. 最终评分修正建议（给出一个新的 0-100 分并解释为什么）

不要鸡汤、不要"总体来说是个不错的想法"、不允许。`,
  },

  // -------- 70+ --------
  {
    kind: "competitor_scan",
    min_score: 70,
    format: "md",
    max_tokens: 6000,
    system:
      BASE_PERSONA +
      `\n你是竞品情报官。只列出真实存在、可验证的产品。如果某个位置没有真竞品，明确写"无直接竞品（蓝海/太窄）"，不要编造。`,
    user: (o) => `${oppContext(o)}

输出 Markdown，包含：

## 直接竞品（至少 6 个，要真实存在）
对每个竞品输出：
- **名称 + 官网 URL**（若不确定则标注"可能 URL"）
- **一句话定位**
- **定价模型**（免费 / 订阅 / 买断）
- **致命弱点**（体验差？功能缺？语言不支持？没有本地化？价格贵？）

## 间接竞品与替代品（Excel / 手工外包 / 免费脚本等）

## 差异化打法（3 条，必须具体到产品动作）
每条要回答：
- 面向海外华人用户，我们多做/少做什么
- 为什么这个差异在第一次使用 30 秒内能被感知

## 定价建议
- 建议定价区间（USD 月付 / 买断）及理由
- 用户画像付费心理依据`,
  },

  // -------- 80+ --------
  {
    kind: "landing_zh",
    min_score: 80,
    format: "html",
    max_tokens: 12000,
    system:
      BASE_PERSONA +
      `\n你是顶级文案 + 前端工程师。直接输出一个 **完整可运行的单文件 HTML Landing Page**，含 Tailwind CDN、可独立浏览器打开。黑白灰科技感，类似 Linear / Perplexity。文案中文。`,
    user: (o) => `${oppContext(o)}

输出要求（只输出 HTML 代码本身，不要任何解释文字，不要用 \`\`\` 包裹）：

- 完整 <!DOCTYPE html> 文档
- <script src="https://cdn.tailwindcss.com"></script>
- 字体用系统字体栈
- 结构：
  1. Hero（一句话痛点钩子 + 副标题 + 主 CTA "开始免费试用"）
  2. 3 个痛点卡片（呼应 pain_point_analysis）
  3. 3 步"它如何解决"
  4. 定价表（Free / Pro / Studio 三档，USD）
  5. FAQ 5 条
  6. Footer 含免责声明和"开发者：独立海外华人团队"
- 使用深色主题 bg-neutral-950 text-neutral-100
- 必须内嵌 JS：CTA 按钮点击 alert("即将开放内测") 兜底
- 必须在 <footer> 下方写一段浅灰小字免责声明，内容："本工具为辅助性 SaaS，不收集/处理/转发任何第三方平台账号凭证。所有账户操作请用户在自身合规范围内自行完成。"`,
  },

  {
    kind: "landing_en",
    min_score: 80,
    format: "html",
    max_tokens: 12000,
    system:
      BASE_PERSONA +
      `\n你是顶级英文 SaaS 文案 + 前端。直接输出一个完整单文件 HTML Landing Page，Tailwind CDN，英文，给海外华人企业看但让非华人也看得懂。`,
    user: (o) => `${oppContext(o)}

Output only the full HTML (no explanations, no code fences). Include:
- Complete <!DOCTYPE html> document
- <script src="https://cdn.tailwindcss.com"></script>
- Dark theme (neutral-950 / neutral-100)
- Hero / 3 pain cards / 3-step How-it-works / Pricing (Free/Pro/Studio USD) / 5-Q FAQ / Footer
- CTA buttons alert "Coming soon — Early access open"
- Footer disclaimer (light gray small text):
  "This product is an assistive SaaS tool. It does not collect, process, or forward any third-party platform credentials. All account-level actions are the user's own responsibility and must comply with the corresponding Terms of Service."`,
  },

  {
    kind: "seo_zh",
    min_score: 80,
    format: "md",
    max_tokens: 8000,
    system:
      BASE_PERSONA +
      `\n你是海外华人 SEO 内容架构师。要写的是能被 Google 收录 + 被海外华人在 Google/微信朋友圈/小红书海外版搜到的长文。禁止水文。`,
    user: (o) => `${oppContext(o)}

写一篇 2500 字以上中文 SEO 长文，Markdown：

# 标题（含核心关键词，必须包含 target_niche）

> TL;DR（100-150 字）

## 目标关键词矩阵
列出 10 个主关键词 + 20 个长尾关键词，表格格式。

## 为什么海外华人[target_niche] 今天都卡在这个问题上
真实场景故事 3 个（具体到城市/平台/金额数字）。

## 现有方案为什么不够用
对比 3 个常见 workaround（Excel / 外包 / 其他 SaaS）各自的致命短板。

## 一个更合理的路径
嵌入我们这个机会的蓝图核心要点，但不要写成广告。

## 实操清单
8-12 条可以今天就照做的动作。

## 常见问题 FAQ
8 条，每条 2-3 句回答。

## CTA
引导到 landing page，"点击获取内测资格"。

全文必须用到 pain_point_analysis 中提到的具体场景。`,
  },

  {
    kind: "seo_en",
    min_score: 80,
    format: "md",
    max_tokens: 8000,
    system:
      BASE_PERSONA +
      `\nYou are a senior programmatic SEO content strategist writing for overseas-Chinese small businesses. No fluff. Every claim must be specific.`,
    user: (o) => `${oppContext(o)}

Write a 2000+ word English SEO article in Markdown:

# H1 (must contain the core keyword and target niche)

> TL;DR (100-150 words)

## Keyword map
10 primary + 20 long-tail keywords in a table.

## Why overseas-Chinese [target_niche] are stuck today
3 realistic scenarios with specific cities / platforms / dollar amounts.

## Why existing workarounds fail
Compare Excel / outsourcing / other SaaS — each with concrete failure modes.

## A saner path
Embed the core of our blueprint naturally, not as an ad.

## Action checklist
8-12 things the reader can do today.

## FAQ
8 items, 2-3 sentences each.

## CTA to landing page.`,
  },

  {
    kind: "social_pack",
    min_score: 80,
    format: "md",
    max_tokens: 6000,
    system:
      BASE_PERSONA +
      `\n你是海外华人社媒操盘手，熟悉 X/Twitter、LinkedIn、小红书（海外版）、微信公众号、Reddit 的发帖规则与钩子风格。`,
    user: (o) => `${oppContext(o)}

输出 Markdown，包含下列全部模块：

## 1. X/Twitter 单推 × 10
每条 ≤ 280 字符。前 3 条用钩子句（问句 / 数字 / 反直觉）。英文。

## 2. X/Twitter Thread × 1
完整 8-12 推 Thread，英文，第一条是强钩子，最后一条是 CTA。

## 3. LinkedIn 帖 × 2
一条短版（3 段），一条长版（含个人叙事）。英文。

## 4. 小红书海外版帖 × 5
中文。标题要带 emoji + 数字。正文 200-400 字，末尾带 3-5 个话题标签。

## 5. 微信公众号开头 × 2
中文，一个"故事开头"版本、一个"数据开头"版本。各 300 字。

## 6. Reddit 自荐帖 × 2
英文，一个发在 r/SaaS（围绕产品 + 复卖模型），一个发在 r/Entrepreneur（围绕发现痛点的过程）。遵循 Reddit 反广告潜规则：先讲故事再顺势提产品。

## 7. 冷启动 DM 模板 × 3
三段话以内，英文。面向种子用户的一对一开场白。`,
  },

  {
    kind: "blueprint_en",
    min_score: 80,
    format: "md",
    max_tokens: 12000,
    system:
      BASE_PERSONA +
      `\nYou output only the English version of a technical blueprint, mirroring the Chinese blueprint's structure but adapted for an English-speaking team. Must include runnable code snippets, SQL schema, License/trial logic, and disclaimer embed points.`,
    user: (o) => `${oppContext(o)}

Write the English edition of the technical blueprint in Markdown, at least 1200 words. Must contain all 8 sections:
1. Stack selection (prefer Next.js App Router + Edge Runtime; Python FastAPI + Cloudflare Workers AI / Anthropic API for heavy AI)
2. Database schema (concrete SQL with types, indexes, RLS)
3. Core business logic (real \`\`\`ts / \`\`\`py snippets, not placeholders)
4. Anti-abuse / prompt injection / license logic (real code)
5. Disclaimer embed points (UI / ToS / export watermark)
6. Trial mechanism (concrete limits, paywall triggers, pricing SKUs)
7. Cold-start distribution (SEO keywords + social hooks + overseas-Chinese community channels)
8. 7-day MVP shipping timeline, day by day.`,
  },
];

export function stagesFor(score: number): StageSpec[] {
  return STAGES.filter((s) => score >= s.min_score);
}

export function stageBySlug(slug: string): StageSpec | undefined {
  return STAGES.find((s) => s.kind === slug);
}
