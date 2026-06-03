/**
 * 自建爬虫 - Evidence Collection Only
 * 
 * 目标：收集真实证据，不做评分
 * 每个证据必须包含：Source, URL, Title, Quote, Engagement, Date
 */

import { Evidence } from './types';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  score?: number;
  numComments?: number;
  created?: number;
  subscribers?: number;
}

interface HackerNewsItem {
  id: number;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  by?: string;
  descendants?: number;
  time?: number;
}

interface RedditPost {
  title: string;
  selftext?: string;
  score?: number;
  num_comments?: number;
  permalink: string;
  created_utc?: number;
  subreddit?: string;
}

interface GitHubRepo {
  full_name: string;
  description?: string;
  stargazers_count?: number;
  forks_count?: number;
  html_url: string;
  updated_at?: string;
  topics?: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ HackerNews ============

export async function collectFromHN(query: string): Promise<Evidence[]> {
  const evidence: Evidence[] = [];
  
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const storyIds: number[] = await response.json();
    
    // 检查前 300 条
    const storyIdsToCheck = storyIds.slice(0, 300);
    const queryLower = query.toLowerCase();
    
    for (const id of storyIdsToCheck) {
      if (evidence.length >= 10) break;
      
      try {
        const itemResponse = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        const item: HackerNewsItem = await itemResponse.json();
        
        if (!item) continue;
        
        const titleLower = (item.title || '').toLowerCase();
        const textLower = (item.text || '').toLowerCase();
        
        if (titleLower.includes(queryLower) || textLower.includes(queryLower)) {
          const engagement = (item.score || 0) + (item.descendants || 0) * 2;
          
          evidence.push({
            source: 'HackerNews',
            type: 'positive',
            title: item.title || 'HN Discussion',
            quote: item.text || 'No description available',
            url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            engagement,
            date: item.time ? new Date(item.time * 1000).toISOString() : undefined
          });
        }
      } catch {
        continue;
      }
      
      await sleep(50);
    }
  } catch (error) {
    console.error('[HN] Collection error:', error);
  }
  
  return evidence;
}

// ============ Reddit ============

export async function collectFromReddit(query: string): Promise<Evidence[]> {
  const evidence: Evidence[] = [];
  
  try {
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=20&sort=relevance`,
      {
        headers: {
          'User-Agent': 'RealityCheck/1.0 (Educational Purpose)'
        }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const posts: RedditPost[] = data.data.children.map((c: any) => c.data);
    
    for (const post of posts) {
      const engagement = (post.score || 0) + (post.num_comments || 0);
      
      evidence.push({
        source: `r/${post.subreddit}`,
        type: 'positive',
        title: post.title,
        quote: post.selftext?.substring(0, 300) || 'No description',
        url: post.permalink.startsWith('http') 
          ? post.permalink 
          : `https://reddit.com${post.permalink}`,
        engagement,
        date: post.created_utc 
          ? new Date(post.created_utc * 1000).toISOString() 
          : undefined
      });
    }
  } catch (error) {
    console.error('[Reddit] Collection error:', error);
  }
  
  return evidence;
}

// ============ GitHub ============

export async function collectFromGitHub(query: string): Promise<Evidence[]> {
  const evidence: Evidence[] = [];
  
  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const repos: GitHubRepo[] = data.items || [];
    
    for (const repo of repos) {
      const engagement = (repo.stargazers_count || 0) + (repo.forks_count || 0);
      
      evidence.push({
        source: 'GitHub',
        type: 'positive',
        title: repo.full_name,
        quote: repo.description || 'No description',
        url: repo.html_url,
        engagement,
        date: repo.updated_at,
        additionalData: `⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}`
      });
    }
  } catch (error) {
    console.error('[GitHub] Collection error:', error);
  }
  
  return evidence;
}

// ============ Google/DuckDuckGo (Basic) ============

export async function collectFromWeb(query: string): Promise<Evidence[]> {
  const evidence: Evidence[] = [];
  
  try {
    // DuckDuckGo Instant Answer (no API key needed)
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.AbstractText) {
      evidence.push({
        source: 'DuckDuckGo',
        type: 'neutral',
        title: query,
        quote: data.AbstractText.substring(0, 300),
        url: data.AbstractURL || '',
        date: data.CreatedAt
      });
    }
    
    // Related Topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          evidence.push({
            source: 'DuckDuckGo',
            type: 'neutral',
            title: query,
            quote: topic.Text.substring(0, 200),
            url: topic.FirstURL || '',
          });
        }
      }
    }
  } catch (error) {
    console.error('[Web] Collection error:', error);
  }
  
  return evidence;
}

// ============ Product Hunt ============

export async function collectFromProductHunt(query: string): Promise<Evidence[]> {
  // Product Hunt 没有公开 API，使用替代方案
  // 搜索 GitHub 上是否有类似项目可以推断
  return collectFromGitHub(`${query} product hunt`);
}

// ============ 主收集函数 ============

export interface CollectOptions {
  includeHN?: boolean;
  includeReddit?: boolean;
  includeGitHub?: boolean;
  includeWeb?: boolean;
  limitPerSource?: number;
}

export async function collectEvidence(
  queries: string[],
  options: CollectOptions = {}
): Promise<Evidence[]> {
  const {
    includeHN = true,
    includeReddit = true,
    includeGitHub = true,
    includeWeb = true,
    limitPerSource = 10
  } = options;
  
  const allEvidence: Evidence[] = [];
  const seenUrls = new Set<string>();
  
  for (const query of queries) {
    console.log(`[Evidence Collection] 收集: "${query}"`);
    
    const promises: Promise<Evidence[]>[] = [];
    
    if (includeHN) {
      promises.push(
        collectFromHN(query).then(e => e.slice(0, 5))
      );
    }
    
    if (includeReddit) {
      promises.push(
        collectFromReddit(query).then(e => e.slice(0, limitPerSource))
      );
    }
    
    if (includeGitHub) {
      promises.push(
        collectFromGitHub(query).then(e => e.slice(0, limitPerSource))
      );
    }
    
    if (includeWeb) {
      promises.push(
        collectFromWeb(query).then(e => e.slice(0, 5))
      );
    }
    
    const results = await Promise.all(promises);
    
    for (const evidenceBatch of results) {
      for (const e of evidenceBatch) {
        if (!seenUrls.has(e.url)) {
          seenUrls.add(e.url);
          allEvidence.push(e);
        }
      }
    }
    
    // 避免过快请求
    await sleep(500);
  }
  
  return allEvidence;
}

/**
 * 生成搜索查询列表
 */
export function generateQueries(
  opportunity: string,
  targetUser: string,
  pain: string
): {
  painQueries: string[];
  demandQueries: string[];
  competitorQueries: string[];
  communityQueries: string[];
} {
  return {
    painQueries: [
      pain,
      `problem with ${targetUser}`,
      `frustrated with ${targetUser}`,
      `${targetUser} issues`,
      `${targetUser} hate`
    ],
    demandQueries: [
      `best ${opportunity}`,
      `${opportunity} alternative`,
      `${opportunity} review`,
      `${opportunity} vs`,
      `how to ${opportunity.toLowerCase()}`
    ],
    competitorQueries: [
      opportunity,
      `${opportunity} tool`,
      `${opportunity} app`,
      `open source ${opportunity}`,
      `${opportunity} github`
    ],
    communityQueries: [
      `${targetUser} subreddit`,
      `${opportunity} community`,
      `r/${targetUser.toLowerCase().replace(/\s+/g, '')}`
    ]
  };
}
