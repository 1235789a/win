// 四维加权最终评分 + 红旗惩罚 + 判断建议
//
// 最终分(0-100) =
//   痛点分(0-100) × 0.30          ← "这个需求真不真"
// + SEO分(0-100) × 0.25           ← "做了有没有人搜得到"
// + 时机分(0-100) × 0.25          ← "现在做来不来得及"
// + 商业分(0-100) × 0.20          ← "已经有人为此付钱了吗"
//
// 红旗惩罚：
//   竞品>8个 in top10 → × 0.6
//   灰产标记 → × 0.3
//   仅单源 + 无催化剂 + 无Trends → × 0.8

export interface FinalScoreInput {
  pain_score: number;
  seo_score: number | null;
  seo_tool_sites: number | null;
  why_now_score: number;
  has_catalysts: boolean;
  has_trends_signal: boolean;
  cross_source_count: number;
  has_upwork: boolean;
  member_count: number;
  has_ads: boolean;
  is_grey: boolean;
  single_source_only: boolean;
}

export interface FinalScoreResult {
  final_score: number;
  pain_weighted: number;
  seo_weighted: number;
  timing_weighted: number;
  biz_weighted: number;
  penalties: string[];
  verdict: "立刻做" | "值得观察" | "暂时不做" | "不做";
  verdict_reason: string;
}

export function computeFinalScore(input: FinalScoreInput): FinalScoreResult {
  const painWeighted = input.pain_score * 0.30;
  let seoRaw = input.seo_score ?? 50;
  const seoWeighted = seoRaw * 0.25;
  const timingWeighted = input.why_now_score * 0.25;

  let bizRaw = 30;
  if (input.has_upwork) bizRaw += 25;
  if (input.has_ads) bizRaw += 15;
  if (input.cross_source_count >= 3) bizRaw += 15;
  else if (input.cross_source_count >= 2) bizRaw += 8;
  if (input.member_count >= 3) bizRaw += 15;
  else if (input.member_count >= 2) bizRaw += 8;
  bizRaw = Math.min(100, bizRaw);
  const bizWeighted = bizRaw * 0.20;

  let raw = painWeighted + seoWeighted + timingWeighted + bizWeighted;
  const penalties: string[] = [];

  if (input.seo_tool_sites != null && input.seo_tool_sites >= 8) {
    raw *= 0.6;
    penalties.push("SEO红海（竞品≥8）");
  }
  if (input.is_grey) {
    raw *= 0.3;
    penalties.push("灰产标记");
  }
  if (input.single_source_only && !input.has_catalysts && !input.has_trends_signal) {
    raw *= 0.8;
    penalties.push("单源弱信号");
  }

  const finalScore = Math.round(Math.max(0, Math.min(100, raw)));

  let verdict: FinalScoreResult["verdict"];
  let verdict_reason: string;

  if (finalScore >= 75) {
    verdict = "立刻做";
    verdict_reason = input.seo_score && input.seo_score >= 80
      ? `SEO竞品少(${input.seo_tool_sites ?? "?"}个) + 痛点强(${input.pain_score}) + 时机对`
      : input.has_catalysts
      ? `命中催化剂 + 增速高 + 窗口期短，先发优势明显`
      : `痛点强 + 商业验证充分，可以开始`;
  } else if (finalScore >= 55) {
    verdict = "值得观察";
    verdict_reason = penalties.length > 0
      ? `有潜力但存在风险: ${penalties.join("、")}`
      : !input.has_catalysts
      ? `痛点存在但缺少时机信号，等催化剂出现`
      : `各维度均衡但不突出，需要更多跨源验证`;
  } else if (finalScore >= 35) {
    verdict = "暂时不做";
    verdict_reason = penalties.length > 0
      ? `受限于: ${penalties.join("、")}`
      : `信号不够强，市场验证不足`;
  } else {
    verdict = "不做";
    verdict_reason = penalties.includes("灰产标记")
      ? "灰产方向，法律风险高"
      : penalties.includes("SEO红海（竞品≥8）")
      ? "市场已饱和，无差异化空间"
      : "综合信号极弱，不值得投入";
  }

  return {
    final_score: finalScore,
    pain_weighted: Math.round(painWeighted),
    seo_weighted: Math.round(seoWeighted),
    timing_weighted: Math.round(timingWeighted),
    biz_weighted: Math.round(bizWeighted),
    penalties,
    verdict,
    verdict_reason,
  };
}
