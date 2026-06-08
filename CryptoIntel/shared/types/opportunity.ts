/**
 * 机会格式定义
 */

export interface DimensionScores {
  pain_to_money: number;      // 0-25
  traffic: number;            // 0-20
  seo: number;                // 0-20
  usdt: number;               // 0-10
  competition: number;        // 0-15
  build_speed: number;        // 0-10
}

export interface Blueprint {
  mvp_features: string[];
  target_users: string;
  monetization: string;
  tech_stack: string[];
  estimated_build_time: string;
  validation_plan: string[];
}

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Opportunity {
  id: string;
  name: string;
  target_niche: string;
  pain_point: string;
  solution: string;
  total_score: number;
  dimensions: DimensionScores;
  priority: Priority;
  blueprint: Blueprint;
  raw_data?: any;
  analyzed_at: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  success: boolean;
  opportunities: Opportunity[];
  total_analyzed: number;
  errors: string[];
  analyzed_at: string;
}

export interface AnalysisConfig {
  min_score?: number;
  max_opportunities?: number;
  dimensions?: (keyof DimensionScores)[];
}