// AI 直接给 score，本文件只负责：
// 1) 把 0-100 分桶成 P0/P1/P2/P3
// 2) 兜底 clamp，防止 AI 返回越界
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
