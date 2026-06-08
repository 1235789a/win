/**
 * Agent-Reach 数据源适配器
 * 集成到现有 AI 情报系统
 */

import type { SourceAdapter, RawItem, HarvestOptions } from "../sources/base";

export interface CryptoMarketingItem {
  platform: string;
  project_name: string;
  project_url: string;
  post_url: string;
  image_url: string;
  date: string;
  engagement: {
    likes?: number;
    retweets?: number;
    replies?: number;
    views?: number;
    score?: number;
    comments?: number;
    upvotes?: number;
  };
  asset_type: "AMA" | "Airdrop" | "Partnership" | "Listing" | "Giveaway" | "Meme" | "Other";
  post_text: string;
  collected_at: string;
  source: string;
}

export class AgentReachSource implements SourceAdapter {
  name = "agent-reach";
  
  private mcpServerUrl: string;
  
  constructor(mcpServerUrl: string = "http://localhost:3001") {
    this.mcpServerUrl = mcpServerUrl;
  }
  
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 100;
    
    try {
      // 尝试调用 MCP Server
      const response = await fetch(`${this.mcpServerUrl}/tools/collect_crypto_marketing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit })
      });
      
      if (response.ok) {
        const data: CryptoMarketingItem[] = await response.json();
        
        return data.map((item) => ({
          platform: item.platform,
          id: `${item.platform}_${Buffer.from(item.post_url).toString("base64url").slice(0, 20)}`,
          text: item.post_text,
          url: item.post_url,
          published_at: item.date,
          engagement: this._calculateEngagement(item.engagement),
          meta: {
            project_name: item.project_name,
            project_url: item.project_url,
            image_url: item.image_url,
            asset_type: item.asset_type,
            likes: item.engagement.likes,
            retweets: item.engagement.retweets,
            replies: item.engagement.replies,
            views: item.engagement.views,
            score: item.engagement.score,
            comments: item.engagement.comments,
            collected_at: item.collected_at,
            source: item.source
          }
        })) as RawItem[];
      }
    } catch (error) {
      console.error("MCP Server 不可用，使用本地 Python 脚本:", error);
      
      // 如果 MCP Server 不可用，尝试运行本地 Python 脚本
      return await this._runLocalPythonScript(limit);
    }
    
    return [];
  }
  
  private _calculateEngagement(engagement: CryptoMarketingItem["engagement"]): number {
    const likes = engagement.likes ?? 0;
    const retweets = engagement.retweets ?? 0;
    const replies = engagement.replies ?? 0;
    const score = engagement.score ?? 0;
    const comments = engagement.comments ?? 0;
    
    return likes + retweets + replies + score + comments;
  }
  
  private async _runLocalPythonScript(limit: number): Promise<RawItem[]> {
    // 运行本地 Python 脚本
    const { execSync } = require("child_process");
    
    try {
      const scriptPath = "/workspace/code/ai-intel/agent_reach/crypto_marketing_channel.py";
      const result = execSync(`python3 ${scriptPath} --limit ${limit} --json`, {
        encoding: "utf-8",
        timeout: 120000
      });
      
      const data: CryptoMarketingItem[] = JSON.parse(result);
      
      return data.map((item) => ({
        platform: item.platform,
        id: `${item.platform}_${Buffer.from(item.post_url).toString("base64url").slice(0, 20)}`,
        text: item.post_text,
        url: item.post_url,
        published_at: item.date,
        engagement: this._calculateEngagement(item.engagement),
        meta: {
          project_name: item.project_name,
          asset_type: item.asset_type,
          source: item.source
        }
      })) as RawItem[];
      
    } catch (error) {
      console.error("Python 脚本执行失败:", error);
      return [];
    }
  }
  
  async searchTwitter(query: string, limit: number = 20): Promise<RawItem[]> {
    try {
      const response = await fetch(`${this.mcpServerUrl}/tools/search_crypto_twitter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit })
      });
      
      if (response.ok) {
        const data: CryptoMarketingItem[] = await response.json();
        
        return data.map((item) => ({
          platform: "twitter",
          id: `twitter_${Buffer.from(item.post_url).toString("base64url").slice(0, 20)}`,
          text: item.post_text,
          url: item.post_url,
          published_at: item.date,
          engagement: this._calculateEngagement(item.engagement),
          meta: {
            project_name: item.project_name,
            asset_type: item.asset_type,
            source: "agent-reach"
          }
        })) as RawItem[];
      }
    } catch (error) {
      console.error("Twitter 搜索失败:", error);
    }
    
    return [];
  }
  
  async getReddit(subreddit: string, limit: number = 20): Promise<RawItem[]> {
    try {
      const response = await fetch(`${this.mcpServerUrl}/tools/get_crypto_reddit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit, limit })
      });
      
      if (response.ok) {
        const data: CryptoMarketingItem[] = await response.json();
        
        return data.map((item) => ({
          platform: "reddit",
          id: `reddit_${Buffer.from(item.post_url).toString("base64url").slice(0, 20)}`,
          text: item.post_text,
          url: item.post_url,
          published_at: item.date,
          engagement: this._calculateEngagement(item.engagement),
          meta: {
            project_name: item.project_name,
            asset_type: item.asset_type,
            source: "agent-reach"
          }
        })) as RawItem[];
      }
    } catch (error) {
      console.error("Reddit 获取失败:", error);
    }
    
    return [];
  }
}

// 导出
export default AgentReachSource;