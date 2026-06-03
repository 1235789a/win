/**
 * Reality Check - Evidence First, Score Second
 * 
 * 目标：过滤掉 90% 的 AI 幻觉机会
 * 方法：收集真实世界证据，不做主观评分
 * 
 * 核心原则：
 * - 没有证据 = 没有分数
 * - 证据必须包含：Source, URL, Title, Date, Engagement, Quote
 * - 找不到付费竞品 = 降低可信度，而不是提高
 */

export interface RealityCheckInput {
  opportunity: string;
  targetUser: string;
  pain: string;
  productIdea?: string;
}

/**
 * 单条证据
 */
export interface Evidence {
  source: string;           // 来源平台
  type: 'positive' | 'negative' | 'neutral';
  title: string;            // 帖子/项目/文章标题
  quote: string;            // 用户原话或描述
  url: string;              // 链接
  engagement?: number;       // 互动数（点赞/评论/收藏）
  date?: string;            // 日期
  additionalData?: string;   // 额外信息（价格/评分等）
}

/**
 * 证据集合
 */
export interface EvidenceCollection {
  painEvidence: Evidence[];           // 痛点证据
  searchEvidence: Evidence[];         // 搜索需求证据
  communityEvidence: Evidence[];       // 社区证据
  competitorEvidence: Evidence[];      // 竞品证据
  paymentEvidence: Evidence[];         // 付费意愿证据
  
  // 统计
  totalEvidence: number;
  sources: {
    reddit: number;
    hackernews: number;
    github: number;
    other: number;
  };
}

/**
 * Reality Check 最终报告
 */
export interface RealityCheckReport {
  opportunity: string;
  summary: string;                    // 一句话总结
  
  // 证据收集结果
  evidence: EvidenceCollection;
  
  // 证据强度
  evidenceStrength: {
    pain: 'Strong' | 'Medium' | 'Weak' | 'None';
    search: 'Strong' | 'Medium' | 'Weak' | 'None';
    community: 'Strong' | 'Medium' | 'Weak' | 'None';
    competitor: 'Strong' | 'Medium' | 'Weak' | 'None';
    payment: 'Strong' | 'Medium' | 'Weak' | 'None';
    overall: 'Strong' | 'Medium' | 'Weak' | 'None';
  };
  
  // 真实数据（不是评分）
  realityStats: {
    totalEvidence: number;
    positiveEvidence: number;
    negativeEvidence: number;
    communitiesFound: number;
    competitorsFound: number;
    paidProductsFound: number;
    avgEngagement: number;
  };
  
  // 强证据列表
  strongEvidence: string[];
  
  // 弱信号
  weakSignals: string[];
  
  // 红旗（高概率幻觉）
  redFlags: string[];
  
  // 最终判决
  verdict: 'BUILD' | 'WATCH' | 'IGNORE';
  realityScore: number;  // 0-100，简单计算
  
  // 核心问题回答
  wouldBuild: boolean;
  wouldBuildReason: string;
  
  // 元数据
  createdAt: Date;
  validationDuration?: number;  // 耗时（秒）
}

/**
 * 判决标准
 */
export const VERDICT_RULES = {
  BUILD: {
    minScore: 70,
    minEvidence: 15,
    requiredStrengths: ['pain', 'payment'],
    forbiddenFlags: ['no_discussion', 'no_competitor']
  },
  WATCH: {
    minScore: 40,
    minEvidence: 5,
    requiredStrengths: ['pain'],
    forbiddenFlags: []
  },
  IGNORE: {
    // 其他所有情况
  }
} as const;
