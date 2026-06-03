/**
 * Gap Discovery Engine
 *
 * 核心目标：从用户抱怨中发现 Market Gaps
 *
 * Silent Harvest 不再寻找：需求
 * 而是寻找：Market Gaps
 */

/**
 * 证据等级
 */
export enum EvidenceGrade {
  S = 'S', // 真实用户（Reddit, IH, G2, Trustpilot, Capterra, AppSumo, PH, GitHub Issues, X）
  A = 'A', // 真实商业数据（定价、销量、收入、用户数、招聘、公开增长）
  B = 'B', // 行业分析（博客、媒体、第三方研究）
  C = 'C'  // AI推理（最低等级，不能单独作为结论依据）
}

/**
 * 频率等级
 */
export enum Frequency {
  VeryHigh = 'VeryHigh',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  VeryLow = 'VeryLow'
}

/**
 * 严重等级
 */
export enum Severity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

/**
 * 缺口强度
 */
export enum GapStrength {
  VeryHigh = 'VeryHigh',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  VeryLow = 'VeryLow'
}

/**
 * 最终裁决
 */
export enum FinalVerdict {
  BUILD = 'BUILD',
  WATCH = 'WATCH',
  IGNORE = 'IGNORE'
}

/**
 * 单个抱怨
 */
export interface Complaint {
  complaint: string;
  frequency: Frequency;
  evidenceCount: number;
  evidenceUrls: string[];
  exampleQuotes: string[];
  severity: Severity;
  grade: EvidenceGrade;
}

/**
 * 市场缺口
 */
export interface MarketGap {
  complaint: string;
  currentSolutions: string[];
  whyExistingSolutionsFail: string;
  marketGap: string;
  opportunityName: string;
  strength: GapStrength;
  gapScore: number; // 0-100
}

/**
 * 缺口评分维度
 */
export interface GapScoreDimensions {
  painSeverity: number;       // 0-20
  complaintFrequency: number; // 0-20
  revenueSignal: number;      // 0-20
  competitionDensity: number; // 0-20
  soloBuildability: number;   // 0-20
  geoPotential: number;       // 0-20
}

/**
 * 竞争对手分析
 */
export interface Competitor {
  name: string;
  monthlyPrice: number | null;
  oneTimePrice: number | null;
  freeTrial: boolean;
  positioning: string;
  evidenceUrl: string;
}

/**
 * MVP 方案
 */
export interface MVP {
  productName: string;
  targetUser: string;
  coreFeature: string;
  pricing: number;
  mvpScope: string[];
  buildTime: number; // 天数
  distributionChannels: string[];
  geoTopics: string[];
}

/**
 * Revenue Signal
 */
export enum RevenueStrength {
  Strong = 'Strong',
  Medium = 'Medium',
  Weak = 'Weak',
  None = 'None'
}

export interface RevenueSignal {
  strength: RevenueStrength;
  hasPaidPlans: boolean;
  hasPriceIncreases: boolean;
  hasEnterprisePlans: boolean;
  hasRenewals: boolean;
  hasLongTermOperation: boolean;
  evidenceUrls: string[];
}

/**
 * Gap Discovery Report
 */
export interface GapDiscoveryReport {
  opportunity: string;

  // Who Pays
  whoPays: string[];

  // Why They Pay
  whyTheyPay: string[];
  topCompetitors: Competitor[];
  revenueSignal: RevenueSignal;

  // Why They Leave
  topComplaints: Complaint[];

  // Market Gaps
  marketGaps: MarketGap[];
  topGap: MarketGap | null;

  // MVP Generation
  suggestedMVP: MVP | null;

  // Founder Filter
  founderFilter: {
    wouldBuild: boolean;
    reason: string;
  };

  // Final
  finalVerdict: FinalVerdict;
}
