/**
 * Reality Check Pipeline
 * 
 * 验证 AI 生成的机会是否真实存在市场需求
 * 
 * 使用方法:
 * import { runRealityCheck } from './src/lib/reality-check';
 * const report = await runRealityCheck({
 *   opportunity: 'AI Token Compressor',
 *   targetUser: 'Developers using LLM APIs',
 *   pain: 'LLM tokens are expensive, inputs are verbose',
 *   productIdea: 'Compress prompts before sending to LLM'
 * });
 */

// Core types
export interface RealityCheckInput {
  opportunity: string;
  targetUser: string;
  pain: string;
  productIdea?: string;
}

export interface ValidationEvidence {
  type: 'positive' | 'negative' | 'neutral';
  source: string;
  content: string;
  url?: string;
  timestamp?: Date;
}

export interface ValidationResult {
  step: number;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  evidence: ValidationEvidence[];
  risks: string[];
  conclusion: string;
  searchQueries: string[];
}

export interface RealityCheckReport {
  input: RealityCheckInput;
  validations: ValidationResult[];
  realityScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  recommendation: string;
  wouldBuild: boolean;
  wouldBuildReason: string;
  createdAt: Date;
  
  // Summary stats
  totalEvidence: number;
  positiveEvidence: number;
  negativeEvidence: number;
  
  // Top risks
  topRisks: string[];
  topStrengths: string[];
}

export interface ValidatorConfig {
  maxSearchResults?: number;
  timeout?: number;
  cacheResults?: boolean;
}

// Validation step names
export const VALIDATION_STEPS = {
  1: 'Pain Validation',
  2: 'Search Demand Validation',
  3: 'Community Validation',
  4: 'Competitor Validation',
  5: 'Payment Validation',
  6: 'Build Validation',
  7: 'GEO Validation',
  8: 'Reality Check'
} as const;

// Score weights for final calculation
export const SCORE_WEIGHTS = {
  painValidation: 0.20,
  searchDemand: 0.15,
  community: 0.10,
  competitor: 0.15,
  payment: 0.20,
  build: 0.10,
  geo: 0.10
} as const;

// Grade thresholds
export const GRADE_THRESHOLDS = {
  A: 80, // 真实市场需求，值得开发
  B: 60, // 需求存在，需进一步验证
  C: 40, // 弱需求，谨慎开发
  D: 0   // 高概率 AI 幻觉，不建议开发
} as const;
