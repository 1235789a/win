// 全局类型：单一契约，全链路引用

export type SourcePlatform =
  | "reddit"
  | "x"
  | "hackernews"
  | "producthunt"
  | "rss"
  | "manual"
  | "url";

// AI analysis 输出 —— 对应 prompts.ts
export interface AnalysisResult {
  title: string;
  target_niche: string;
  pain_point_analysis: string;
  build_once_sell_infinite: boolean;
  score: number;
  tags: string[];
  blueprint: string;
}

export type Priority = "P0" | "P1" | "P2" | "P3";

// 深加工产物类型
export type ArtifactKind =
  | "critique"
  | "competitor_scan"
  | "landing_zh"
  | "landing_en"
  | "seo_zh"
  | "seo_en"
  | "social_pack"
  | "blueprint_en";

export interface Artifact {
  id: number;
  created_at: string;
  opportunity_id: number;
  kind: ArtifactKind;
  content: string;
  format: "md" | "html" | "json" | "text";
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

export interface Opportunity {
  id: number;
  created_at: string;
  source_platform: SourcePlatform;
  source_url: string | null;
  raw_text: string;

  title: string;
  target_niche: string;
  pain_point_analysis: string;
  build_once_sell_infinite: 0 | 1;
  score: number;
  priority: Priority;
  tags: string;
  blueprint: string;
  has_blueprint: 0 | 1;
  analysis_json: string;

  tokens_in: number;
  tokens_out: number;
  cost_usd: number;

  favorite: 0 | 1;
}

export interface Run {
  id: number;
  started_at: string;
  ended_at: string | null;
  label: string;
  items_total: number;
  items_ok: number;
  items_err: number;
  p0_count: number;
  p1_count: number;
  total_cost_usd: number;
  budget_usd: number;
}
