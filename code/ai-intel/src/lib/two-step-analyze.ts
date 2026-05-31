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
import { clampScore, scoreToPriority, adjustScore } from "@/lib/scorer";
import type { AnalysisResult, SourcePlatform } from "@/lib/types";

// ─── Step 1 的精简 prompt ───

const STEP1_SYSTEM = `你是一名独立产品创始人。快速判断一条帖子是否包含可行的产品机会。

【时间范围】只关注**最近半年内**的新趋势、新痛点、新产品。

【评分标准（必须严格执行）】
90-100 分（极品，必做）：
- 极垂直细分市场（不是所有开发者，是"北美 Upwork 月入 $3k-$10k 的网页开发者"这种）
- **快速增长趋势**：最近半年内相关讨论增长300%以上，热度持续上升
- 痛点非常强烈（用户主动在找解决方案，愿意见立刻付费）
- **低竞争：市场上基本没人做，或只有1-2个做得很烂的竞品
- **低投入：1-2人、2-4周能上线MVP
- Build Once / Sell Infinite / Zero Support 命中 5/5
- 愿意接受 USDT 支付

75-89 分（优秀，值得做）：
- 垂直细分市场
- **增长趋势良好**：最近半年内相关讨论增长100-300%
- 痛点清晰可验证
- **中低竞争：市场上只有2-5个竞品，都有明显缺陷
- **低投入：1-2人、2-4周能上线MVP
- Build Once / Sell Infinite / Zero Support 命中 4/5
- 愿意接受 USDT 支付

60-74 分（一般）：
- 市场偏泛但有明确子群
- **增长平缓**：最近半年内讨论增长 <100%
- 痛点存在但可能不紧急
- **竞争中等：有10+竞品
- Build Once / Sell Infinite / Zero Support 命中 2-3/5

<40 分（无效）：
- 泛泛而谈的通用问题
- 没有明确的付费意愿
- 不接受加密货币
- **高竞争市场（10+成熟竞品）
- **增长停滞或下降**

【加分规则】
- 快速增长趋势（300%+）→ +20分
- 增长良好（100-300%）→ +10分
- 低竞争（<3个竞品 → +15分
- 低投入（2周内能上线 → +10分
- 利基市场非常具体 → +10分

【扣分规则】
- target_niche 太泛 → 扣 20-30 分
- 没有包含愿意接受 USDT → 扣 30 分
- 高竞争市场（10+成熟竞品）→ 扣 40 分
- 增长停滞或下降 → 扣 25 分
- 灰产（绕过风控/伪造/爬付费数据）→ score ≤ 20

【输出要求】
严格 JSON，不带围栏。只输出以下字段，不输出 blueprint：
{
  "title": "产品名（中文 8-20 字）",
  "target_niche": "具体子行业+地域+接受USDT+使用场景+用户画像",
  "score": 0-100,
  "tags": ["tag1","tag2","tag3"],
  "pain_summary": "一句话概括痛点（30-60 字）",
  "build_once_sell_infinite": true/false,
  "seo_keyword": "如果用户要搜这个工具，最可能用的英文搜索词（2-4个单词，如 ai resume builder）"
}`;

const STEP1_USER = (platform: string, text: string) =>
  `来源：${platform}\n原文：\n"""\n${text.slice(0, 1500)}\n"""`;

// ─── Step 2 的 blueprint-only prompt ───

const STEP2_SYSTEM = `你是一名顶级全栈独立开发者。你的任务是为一个已确认的高分产品机会生成详细的技术 blueprint。

【战略指导】
我们只做"低投入、快速超过竞品"的项目，拒绝大而全：
- 1-2人、2-4周必须能上线MVP
- 找竞品的核心缺陷，只做1-2个杀手锏功能就够了
- 接受 USDT 支付是硬性要求

blueprint 必须严格按以下 8 个章节输出（markdown ## 标题）：
## 1. 核心魔法（Core Magic）—— 含核心算法代码（30-80行可跑TS/Python）
## 2. MVP 最小切片（2周版本）—— 3-5个功能 + 30秒体验描述
## 3. 差异化 / 快速超越策略 —— 列出2-3个真实竞品，详细说明：
   - 竞品的**致命缺陷**
   - 我们用**什么功能**1周内就能超过他们
   - 具体**超越路径**（不需要完美，只要比竞品好10倍就行）
## 4. 数据层 —— 1-3张核心表DDL
## 5. 定价与转化（强制USDT）—— SKU（USDT定价）+ 付费触发 + 首月ARR预估
## 6. 前10个付费用户从哪来 —— 具体渠道+帖子文案+7天日程
## 7. 防滥用 / License 最小集 —— 2-3个防护+代码片段
## 8. 可执行度自查 —— 4个问题如实回答

输出纯 markdown 文本（不是 JSON），直接从 ## 1 开始。`;

const STEP2_USER = (title: string, niche: string, painSummary: string, rawText: string) =>
  `产品名：${title}
目标市场：${niche}
痛点摘要：${painSummary}
原始帖子：
"""
${rawText.slice(0, 2000)}
"""

请生成 blueprint（不少于1200字中文 + 至少2段真实代码）。`;

// ─── 接口 ───

export interface Step1Result {
  title: string;
  target_niche: string;
  score: number;
  tags: string[];
  pain_summary: string;
  build_once_sell_infinite: boolean;
  seo_keyword: string;
  usage: { tokens_in: number; tokens_out: number; cost_usd: number };
}

export interface TwoStepResult {
  title: string;
  target_niche: string;
  pain_point_analysis: string;
  build_once_sell_infinite: boolean;
  score: number;
  tags: string[];
  blueprint: string;
  priority: string;
  seo_keyword: string;
  seo?: { keyword: string; score: number; difficulty: string; tool_sites: number; has_ads: boolean; long_tail: string[] } | null;
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
    tags?: string[];
    pain_summary?: string;
    build_once_sell_infinite?: boolean;
    seo_keyword?: string;
  }>({
    system: STEP1_SYSTEM,
    user: STEP1_USER(platform, text),
    maxTokens: 2048,
    temperature: opts?.temperature ?? 0.2,
    model: opts?.model,
  });

  const rawScore = clampScore(r.data.score);
  const targetNiche = (r.data.target_niche ?? "未指定").toString().slice(0, 120);
  const buildOnce = !!r.data.build_once_sell_infinite;
  
  // 使用智能评分调整
  const finalScore = adjustScore(rawScore, targetNiche, buildOnce);
  
  return {
    title: (r.data.title ?? "未命名").toString().slice(0, 80),
    target_niche: targetNiche,
    score: finalScore,
    tags: Array.isArray(r.data.tags)
      ? r.data.tags.map(String).filter(Boolean).slice(0, 8)
      : [],
    pain_summary: (r.data.pain_summary ?? "").toString().slice(0, 200),
    build_once_sell_infinite: buildOnce,
    seo_keyword: (r.data.seo_keyword ?? "").toString().slice(0, 60),
    usage: {
      tokens_in: r.usage.tokens_in,
      tokens_out: r.usage.tokens_out,
      cost_usd: r.usage.cost_usd,
    },
  };
}

/**
 * Step 2: 生成 blueprint（仅 score>=80 调用）
 * 用 askText 而不是 askJSON，因为 blueprint 是 markdown
 */
export async function generateBlueprint(
  title: string,
  niche: string,
  painSummary: string,
  rawText: string,
  opts?: { model?: string }
): Promise<{ blueprint: string; usage: { tokens_in: number; tokens_out: number; cost_usd: number } }> {
  // 引用 askText，但要从 ai-core 拿（不走 JSON parse）
  const { askText } = await import("@mi/ai-core");
  const r = await askText({
    system: STEP2_SYSTEM,
    user: STEP2_USER(title, niche, painSummary, rawText),
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
 * 默认 threshold=80
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
  const threshold = opts?.blueprintThreshold ?? 80;

  // Step 1
  const s1 = await quickScore(platform, text, { model: opts?.model });

  const totalUsage = { ...s1.usage };
  let blueprint = "";
  let seoResult: TwoStepResult["seo"] = null;

  // SEO 分析（仅 score>=60 且有 seo_keyword 时跑，避免浪费 SerpAPI 额度）
  if (s1.score >= 60 && s1.seo_keyword && process.env.SERPAPI_KEY) {
    try {
      const { analyzeKeywordSEO } = await import("@/lib/seo-score");
      const seo = await analyzeKeywordSEO(s1.seo_keyword);
      if (seo) {
        seoResult = {
          keyword: seo.keyword,
          score: seo.seo_score,
          difficulty: seo.difficulty,
          tool_sites: seo.tool_sites_in_top10,
          has_ads: seo.has_ads,
          long_tail: seo.suggested_long_tail,
        };
      }
    } catch {}
  }

  // Step 2（仅高分 + 不跳过）
  if (s1.score >= threshold && !opts?.skipBlueprint) {
    try {
      const s2 = await generateBlueprint(
        s1.title,
        s1.target_niche,
        s1.pain_summary,
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
    build_once_sell_infinite: s1.build_once_sell_infinite,
    score: s1.score,
    tags: s1.tags,
    blueprint,
    priority: scoreToPriority(s1.score),
    seo_keyword: s1.seo_keyword,
    seo: seoResult,
    usage: totalUsage,
  };
}
