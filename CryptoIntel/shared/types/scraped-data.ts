/**
 * 爬虫数据格式定义
 */

export interface Engagement {
  likes?: number;
  retweets?: number;
  replies?: number;
  views?: number;
  score?: number;
  comments?: number;
  upvotes?: number;
}

export interface AssetType {
  type: 'AMA' | 'Airdrop' | 'Partnership' | 'Listing' | 'Giveaway' | 'Meme' | 'Other';
  confidence: number;
}

export interface ScraperData {
  platform: 'twitter' | 'reddit' | 'youtube' | 'medium' | 'rss' | 'telegram' | 'discord';
  project_name: string;
  project_url: string;
  post_url: string;
  image_url?: string;
  date: string;
  engagement: Engagement;
  asset_type: AssetType['type'];
  post_text: string;
  collected_at: string;
  source: 'agent-reach' | 'manual';
  metadata?: Record<string, any>;
}

export interface ScraperConfig {
  platforms: ScraperData['platform'][];
  limit_per_platform: number;
  keywords?: string[];
  subreddits?: string[];
  twitter_accounts?: string[];
}

export interface ScraperResult {
  success: boolean;
  data: ScraperData[];
  errors: string[];
  collected_at: string;
  duration_ms: number;
}