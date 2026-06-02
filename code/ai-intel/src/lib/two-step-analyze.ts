// 两步管线：控制 token 消耗
//
// Step 1（cheap）: 快速评分，只输出 score/title/niche/tags/pain_point_analysis
//   - maxTokens: 2048（实际输出 ~500-800 token）
//   - 不生成 blueprint → 省 80%+ token
//
// Step 2（heavy，仅 score>=80 触发）: 生成完整 blueprint
//   - maxTokens: 65536
//   - 只对已确认高分痛点花这个钱
//
// 成本对比：
//   旧管线：每条 ~6000 token out（含 blueprint）
//   两步管线：低分 ~800 token out + 高分 ~6800 token out
//   若 70% 痛点 score<80 → 总成本降 60%

import { askJSON, type AskOptions } from "@/lib/ai";
import { SYSTEM_PROMPT, ANALYSIS_USER_PROMPT } from "@/lib/prompts";
import { clampScore, scoreToPriority } from "@/lib/scorer";
import type { AnalysisResult, SourcePlatform } from "@/lib/types";

// ─── Step 1 的精简 prompt ───

const STEP1_SYSTEM = `你是一名**海外 AI 工具站套利猎手**。你的任务是发现能被个人开发者在 2-4 周完成、通过 SEO/GEO/社区流量获得用户、并快速变现的 AI 工具机会。

【目标画像】
- 个人开发者（1人团队）
- 使用 AI 辅助开发
- 2-4 周完成 MVP
- 面向海外用户
- 优先 USDT 收款
- 不做企业销售、不签合同
- 不做重交付、不做定制开发
- 优先一次性付费（One-time Payment）
- 接受插件、工具站、小型 SaaS
- 目标是快速验证并回本

【评分系统 - 6个维度，总分100分】

1. Pain-to-Money Signal（25分）
   重点分析：
   - 用户是否主动寻找解决方案
   - 是否愿意付费
   - 是否已经花钱解决
   - 是否存在购买信号

   强购买信号（每次出现 +5分）：
   - "I would pay for this"
   - "Take my money"
   - "Happy to pay"
   - "Need a tool for this"
   - "Looking for a solution"
   - "Paying freelancers to do this"
   - "Is there a tool"
   - "This should exist"
   - "I'd buy this"

   弱购买信号（每次出现 +1分）：
   - "This sucks"
   - "Annoying"
   - "Frustrated"

2. Traffic Acquisition Score（20分）
   评估用户是否容易获取。
   
   高分（15-20分）：
   - 用户集中在 Reddit 社区
   - Discord/Telegram 群组
   - Facebook Groups
   - Product Hunt
   - Indie Hackers
   
   中分（8-14分）：
   - SEO 可获取（用户会搜索工具）
   - 博客/论坛用户
   
   低分（0-7分）：
   - 只能广告获客
   - 分散在不同平台

3. SEO/GEO Potential（20分）
   分析：
   - 是否存在明确搜索需求
   - 是否存在长尾关键词
   - 是否适合 GEO（AI 搜索引用）
   - 是否适合 SEO 排名
   
   高分（15-20分）：
   - "What is the best tool for X"
   - "How to do X automatically"
   - "X tool recommendations"
   - 明确的工具类搜索词
   
   低分（0-7分）：
   - 用户不会搜索工具
   - 需求太抽象

4. USDT Compatibility（10分）
   评估目标群体接受 USDT 的可能性。
   
   高分（8-10分）：
   - Crypto/Web3 社区
   - Developers
   - Freelancers
   - Online marketers
   - Indie hackers
   - Remote workers
   
   低分（0-4分）：
   - 普通消费者
   - 传统行业从业者
   - 需要发票/合同的企业

5. Competition Gap（15分）
   分析：
   - 是否存在市场空白
   - 是否存在价格过高的竞品
   - 是否存在体验差的竞品
   
   寻找机会：
   - "expensive alternatives"
   - "overpriced"
   - "missing features"
   - "abandoned tools"
   - "poor UX"
   - "no good options"
   
   高分（12-15分）：无竞品或竞品都很烂
   中分（6-11分）：有竞品但有改进空间
   低分（0-5分）：红海市场

6. Build Speed（10分）
   评估 MVP 能否在 2-4 周完成。
   
   优先发现：
   - Chrome 插件
   - AI 工具站（单页应用）
   - Automation 工具（API 组合）
   - SEO/GEO 工具
   - Marketing 工具
   - Creator 工具
   - Developer 工具
   
   降低权重：
   - 企业 SaaS
   - CRM/ERP 类
   - 需要销售团队
   - 需要合同签署
   - 复杂后端系统
   
   高分（8-10分）：API 组合 + 前端 = MVP
   中分（4-7分）：需要一些后端开发
   低分（0-3分）：需要 1 个月以上

【评分标准】
- 总分 ≥ 75：P0（极品，立刻做）
- 总分 60-74：P1（优秀，值得做）
- 总分 45-59：P2（一般）
- 总分 < 45：P3（放弃）

【输出要求】
严格 JSON，不带围栏。必须包含所有字段：
{
  "title": "产品名（英文，8-25字，如 'AI Resume Builder'）",
  "target_niche": "目标垂直细分领域（如 'Developers', 'Content Creators', 'Freelancers', 'Crypto Traders'）",
  "score": 0-100,
  "pain_summary": "一句话概括痛点（30-60字）",
  "buy_signal_score": 0-100,
  "traffic_score": 0-100,
  "seo_geo_score": 0-100,
  "usdt_score": 0-100,
  "competition_gap": 0-100,
  "build_speed": 0-100,
  "why_now": "为什么现在是最好的时机（1-2句话）",
  "distribution_channel": "主要获客渠道（Reddit/SEO/插件市场等）",
  "traffic_source": "目标用户聚集地",
  "one_time_payment_possible": true/false,
  "target_price_usd": 建议价格（USD，不填 USDT 溢价）,
  "tags": ["tag1","tag2","tag3"],
  "competitors_analysis": "竞品分析（1-2句话）",
  "mvp_stack": "推荐技术栈（1-2句话）"
}`;

const STEP1_USER = (platform: string, text: string) =>
  `来源：${platform}\n原文：\n"""\n${text.slice(0, 1500)}\n"""`;

// ─── Step 2 的 blueprint-only prompt ───

const STEP2_SYSTEM = `你是一名**海外 AI 工具站套利专家**。你的任务是为一个已确认的高分套利机会生成详细的技术 blueprint。

【战略目标】
- 个人开发者 2-4 周完成 MVP
- 优先一次性付费（One-time Payment）
- USDT 收款
- 快速验证并回本
- 不做企业销售、不签合同、不做定制开发

blueprint 必须严格按以下 8 个章节输出（markdown ## 标题）：
## 1. 核心价值主张（Core Value Prop）
   - 30字内的产品定位
   - 核心解决什么问题
   - 为什么用户会选择你

## 2. MVP 最小切片（2周版本）
   - 3-5个核心功能
   - 30秒体验描述
   - 技术栈推荐

## 3. 差异化 / 快速超越策略
   - 列出2-3个真实竞品
   - 竞品的**致命缺陷**（价格过高、功能缺失、体验差、停更）
   - 我们用**什么功能**1周内就能超过他们
   - 具体**超越路径**（不需要完美，只要比竞品好10倍就行）

## 4. 定价策略（USDT 优先）
   - USDT 定价（标注 USD 换算）
   - 一次性付费 SKU
   - 插件/附加产品定价
   - 首月 ARR 预估

## 5. 获客渠道（社区流量 + SEO）
   - 主要获客渠道（Reddit/SEO/插件市场）
   - 第一个 100 用户的具体获取计划（7天日程）
   - 关键社区帖子文案

## 6. 技术架构
   - 1-3张核心表 DDL（可选）
   - 核心 API 设计
   - AI/LLM 集成方案

## 7. 防滥用 / License
   - 2-3个防护措施
   - 代码示例
   - 防止盗用的策略

## 8. 快速验证检查清单
   - 4个问题如实回答
   - MVP 是否能在 2 周内完成
   - 是否能快速回本

输出纯 markdown 文本（不是 JSON），直接从 ## 1 开始。`;

const STEP2_USER = (title: string, painSummary: string, whyNow: string, competitorsAnalysis: string, rawText: string) =>
  `产品名：${title}
痛点摘要：${painSummary}
为什么现在：${whyNow}
竞品分析：${competitorsAnalysis}
原始帖子：
"""
${rawText.slice(0, 2000)}
"""

请生成 blueprint（不少于1200字，包含具体的获客计划和定价策略）。`;

// ─── 接口 ───

export interface Step1Result {
  title: string;
  target_niche: string;
  score: number;
  pain_summary: string;
  buy_signal_score: number;
  traffic_score: number;
  seo_geo_score: number;
  usdt_score: number;
  competition_gap: number;
  build_speed: number;
  why_now: string;
  distribution_channel: string;
  traffic_source: string;
  one_time_payment_possible: boolean;
  target_price_usd: number;
  tags: string[];
  competitors_analysis: string;
  mvp_stack: string;
  usage: { tokens_in: number; tokens_out: number; cost_usd: number };
}

export interface TwoStepResult {
  title: string;
  target_niche: string;
  pain_point_analysis: string;
  score: number;
  priority: string;
  buy_signal_score: number;
  traffic_score: number;
  seo_geo_score: number;
  usdt_score: number;
  competition_gap: number;
  build_speed: number;
  why_now: string;
  distribution_channel: string;
  traffic_source: string;
  one_time_payment_possible: boolean;
  target_price_usd: number;
  tags: string[];
  competitors_analysis: string;
  mvp_stack: string;
  blueprint: string;
  usage: { tokens_in: number; tokens_out: number; cost_usd: number };
}

/**
 * Step 1: 快速评分（~800 token out）
 */
export async function quickScore(
  platform: string,
  text: string,
  opts?: { temperature?: number; model?: string }
): Promise<Step1Result> {
  const r = await askJSON<{
    title?: string;
    target_niche?: string;
    score?: number;
    pain_summary?: string;
    buy_signal_score?: number;
    traffic_score?: number;
    seo_geo_score?: number;
    usdt_score?: number;
    competition_gap?: number;
    build_speed?: number;
    why_now?: string;
    distribution_channel?: string;
    traffic_source?: string;
    one_time_payment_possible?: boolean;
    target_price_usd?: number;
    tags?: string[];
    competitors_analysis?: string;
    mvp_stack?: string;
  }>({
    system: STEP1_SYSTEM,
    user: STEP1_USER(platform, text),
    maxTokens: 2048,
    temperature: opts?.temperature ?? 0.2,
    model: opts?.model,
  });

  return {
    title: (r.data.title ?? "未命名").toString().slice(0, 80),
    target_niche: (r.data.target_niche ?? "General").toString().slice(0, 50),
    score: clampScore(r.data.score),
    pain_summary: (r.data.pain_summary ?? "").toString().slice(0, 200),
    buy_signal_score: clampScore(r.data.buy_signal_score),
    traffic_score: clampScore(r.data.traffic_score),
    seo_geo_score: clampScore(r.data.seo_geo_score),
    usdt_score: clampScore(r.data.usdt_score),
    competition_gap: clampScore(r.data.competition_gap),
    build_speed: clampScore(r.data.build_speed),
    why_now: (r.data.why_now ?? "").toString().slice(0, 200),
    distribution_channel: (r.data.distribution_channel ?? "").toString().slice(0, 100),
    traffic_source: (r.data.traffic_source ?? "").toString().slice(0, 100),
    one_time_payment_possible: !!r.data.one_time_payment_possible,
    target_price_usd: Number(r.data.target_price_usd) || 0,
    tags: Array.isArray(r.data.tags)
      ? r.data.tags.map(String).filter(Boolean).slice(0, 8)
      : [],
    competitors_analysis: (r.data.competitors_analysis ?? "").toString().slice(0, 300),
    mvp_stack: (r.data.mvp_stack ?? "").toString().slice(0, 200),
    usage: {
      tokens_in: r.usage.tokens_in,
      tokens_out: r.usage.tokens_out,
      cost_usd: r.usage.cost_usd,
    },
  };
}

/**
 * Step 2: 生成 blueprint（仅 score>=75 调用）
 * 用 askText 而不是 askJSON，因为 blueprint 是 markdown
 */
export async function generateBlueprint(
  title: string,
  painSummary: string,
  whyNow: string,
  competitorsAnalysis: string,
  rawText: string,
  opts?: { model?: string }
): Promise<{ blueprint: string; usage: { tokens_in: number; tokens_out: number; cost_usd: number } }> {
  // 引用 askText，但要从 ai-core 拿（不走 JSON parse）
  const { askText } = await import("@mi/ai-core");
  const r = await askText({
    system: STEP2_SYSTEM,
    user: STEP2_USER(title, painSummary, whyNow, competitorsAnalysis, rawText),
    maxTokens: 65536,
    temperature: 0.3,
    model: opts?.model,
  });
  return {
    blueprint: r.data,
    usage: {
      tokens_in: r.usage.tokens_in,
      tokens_out: r.usage.tokens_out,
      cost_usd: r.usage.cost_usd,
    },
  };
}

/**
 * 完整两步管线：quickScore → (if score>=threshold) → generateBlueprint
 * 默认 threshold=75
 */
export async function twoStepAnalyze(
  platform: string,
  text: string,
  opts?: {
    blueprintThreshold?: number;
    skipBlueprint?: boolean;
    model?: string;
  }
): Promise<TwoStepResult> {
  const threshold = opts?.blueprintThreshold ?? 75;

  // Step 1
  const s1 = await quickScore(platform, text, { model: opts?.model });

  const totalUsage = { ...s1.usage };
  let blueprint = "";

  // Step 2（仅高分 + 不跳过）
  if (s1.score >= threshold && !opts?.skipBlueprint) {
    try {
      const s2 = await generateBlueprint(
        s1.title,
        s1.pain_summary,
        s1.why_now,
        s1.competitors_analysis,
        text,
        { model: opts?.model }
      );
      blueprint = s2.blueprint;
      totalUsage.tokens_in += s2.usage.tokens_in;
      totalUsage.tokens_out += s2.usage.tokens_out;
      totalUsage.cost_usd += s2.usage.cost_usd;
    } catch (err: any) {
      // blueprint 失败不影响主流程
      console.warn("[two-step] blueprint generation failed:", err?.message);
    }
  }

  return {
    title: s1.title,
    target_niche: s1.target_niche,
    pain_point_analysis: s1.pain_summary,
    score: s1.score,
    priority: scoreToPriority(s1.score),
    buy_signal_score: s1.buy_signal_score,
    traffic_score: s1.traffic_score,
    seo_geo_score: s1.seo_geo_score,
    usdt_score: s1.usdt_score,
    competition_gap: s1.competition_gap,
    build_speed: s1.build_speed,
    why_now: s1.why_now,
    distribution_channel: s1.distribution_channel,
    traffic_source: s1.traffic_source,
    one_time_payment_possible: s1.one_time_payment_possible,
    target_price_usd: s1.target_price_usd,
    tags: s1.tags,
    competitors_analysis: s1.competitors_analysis,
    mvp_stack: s1.mvp_stack,
    blueprint,
    usage: totalUsage,
  };
}
