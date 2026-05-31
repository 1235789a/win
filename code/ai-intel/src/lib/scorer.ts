// AI 直接给 score，本文件只负责：
// 1) 把 0-100 分桶成 P0/P1/P2/P3
// 2) 兜底 clamp，防止 AI 返回越界
// 3) 智能评分调整（确保只有真正垂直且接受 USDT 的方案才能拿高分）
// 未来要加人工权重/调参，往这里加函数即可

import type { Priority } from "./types";

export function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function scoreToPriority(score: number): Priority {
  if (score >= 80) return "P0";
  if (score >= 60) return "P1";
  if (score >= 40) return "P2";
  return "P3";
}

// 智能调整分数：确保只有接受 USDT、垂直细分、低竞争、低投入、快速增长的方案才能拿到高分
export function adjustScore(originalScore: number, targetNiche: string, buildOnceSellInfinite: boolean): number {
  let adjusted = originalScore;
  
  // 检查是否包含 USDT（必须要求）
  const hasUSDT = /USDT|usdt|加密货币|crypto|TRC20|ERC20/i.test(targetNiche);
  if (!hasUSDT && adjusted >= 60) {
    adjusted = Math.min(adjusted - 30, 59); // 扣 30 分，最多只能到 P1 上限
  }
  
  // 检查 target_niche 是否足够具体
  const isTooGeneric = /独立开发者|海外华人|自由职业者|跨境电商|软件工程师|创业者/.test(targetNiche);
  const hasEnoughDetails = targetNiche.length >= 30 && (
    /北美|欧洲|东南亚|南美/.test(targetNiche) &&
    /\$|美元|收入|GMV/.test(targetNiche)
  );
  
  if (isTooGeneric && !hasEnoughDetails && adjusted >= 60) {
    adjusted = Math.min(adjusted - 20, 69); // 扣 20 分
  }
  
  // Build Once Sell Infinite 加分
  if (buildOnceSellInfinite && adjusted >= 50) {
    adjusted = Math.min(adjusted + 5, 100);
  }
  
  // 鼓励低投入、低竞争、快速增长的词汇
  const lowCompetitionKeywords = /没有做|没人做|很少人做|没有解决方案|缺少|空白|小众|利基|niche|untapped/i;
  const lowEffortKeywords = /2周|2-4周|简单|容易|轻量|低成本|MVP|小工具/i;
  const rapidGrowthKeywords = /快速增长|增长300|增长200|增长100|持续上升|爆发|爆炸式|trending|exploding|growing fast/i;
  const moderateGrowthKeywords = /增长良好|上升趋势|增长100|growing steadily/i;
  const declineKeywords = /停滞|下降|衰退|declining|stagnant/i;
  
  if (lowCompetitionKeywords.test(targetNiche) && adjusted >= 50) {
    adjusted = Math.min(adjusted + 15, 100); // 低竞争市场 +15分
  }
  
  if (lowEffortKeywords.test(targetNiche) && adjusted >= 50) {
    adjusted = Math.min(adjusted + 10, 100); // 低投入 +10分
  }
  
  if (rapidGrowthKeywords.test(targetNiche) && adjusted >= 50) {
    adjusted = Math.min(adjusted + 20, 100); // 快速增长 +20分
  }
  
  if (moderateGrowthKeywords.test(targetNiche) && adjusted >= 50) {
    adjusted = Math.min(adjusted + 10, 100); // 良好增长 +10分
  }
  
  if (declineKeywords.test(targetNiche) && adjusted >= 50) {
    adjusted = Math.max(adjusted - 25, 0); // 增长停滞/下降 -25分
  }
  
  return clampScore(adjusted);
}
