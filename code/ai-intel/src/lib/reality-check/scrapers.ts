/**
 * 自建爬虫工具模块
 * 
 * 提供对各平台的搜索和验证能力
 * 无需外部 API 密钥
 */

import { ValidationEvidence } from './types';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  platform?: string;
}

interface HackerNewsItem {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  by: string;
  descendants: number;
  kids?: number[];
  time: number;
}

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
  subreddit: string;
}

// ============ HackerNews 爬虫 ============

/**
 * 搜索 Hacker News
 */
export async function searchHackerNews(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    // 获取 Top Stories
    const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const response = await fetch(topStoriesUrl);
    const storyIds: number[] = await response.json();
    
    // 只检查前 500 条
    const storyIdsToCheck = storyIds.slice(0, 500);
    const results: SearchResult[] = [];
    
    // 批量获取故事详情
    const batchSize = 10;
    for (let i = 0; i < storyIdsToCheck.length && results.length < limit; i += batchSize) {
      const batch = storyIdsToCheck.slice(i, i + batchSize);
      const promises = batch.map(async (id) => {
        try {
          const itemResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`
          );
          return await itemResponse.json() as HackerNewsItem;
        } catch {
          return null;
        }
      });
      
      const items = await Promise.all(promises);
      
      for (const item of items) {
        if (!item) continue;
        
        // 检查标题和文本是否包含查询词
        const searchLower = query.toLowerCase();
        const titleLower = (item.title || '').toLowerCase();
        const textLower = (item.text || '').toLowerCase();
        
        if (titleLower.includes(searchLower) || textLower.includes(searchLower)) {
          results.push({
            title: item.title || '',
            snippet: item.text || '',
            url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            platform: 'HackerNews'
          });
        }
      }
      
      // 添加延迟避免过快请求
      await sleep(100);
    }
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('HN search error:', error);
    return [];
  }
}

/**
 * 获取 HN 上的讨论数量
 */
export async function getHNDiscussionCount(query: string): Promise<number> {
  const results = await searchHackerNews(query, 50);
  return results.length;
}

// ============ Reddit 爬虫 ============

/**
 * 搜索 Reddit（通过 JSON 格式）
 */
export async function searchReddit(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    // 使用 Reddit 的 JSON 搜索 API
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'OpportunityAnalyzer/1.0 (Educational Purpose)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
    const posts: RedditPost[] = data.data.children.map((child: any) => child.data);
    
    return posts.map((post) => ({
      title: post.title,
      snippet: post.selftext?.substring(0, 300) || '',
      url: post.url || post.permalink,
      platform: `r/${post.subreddit}`
    }));
  } catch (error) {
    console.error('Reddit search error:', error);
    return [];
  }
}

/**
 * 获取 Reddit 社区规模
 */
export async function getSubredditInfo(subreddit: string): Promise<{ members: number; online: number } | null> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/about.json`, {
      headers: {
        'User-Agent': 'OpportunityAnalyzer/1.0 (Educational Purpose)'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      members: data.data.subscribers || 0,
      online: data.data.accounts_active || 0
    };
  } catch {
    return null;
  }
}

// ============ Google 搜索（简化版）===========

/**
 * 模拟 Google 搜索（使用 DuckDuckGo 的 Instant Answer API）
 * 这个不需要 API 密钥
 */
export async function searchDuckDuckGo(query: string, limit = 10): Promise<SearchResult[]> {
  try {
    // 使用 DuckDuckGo Instant Answer API
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    // 提取相关主题
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, limit)) {
        if (topic.Text) {
          results.push({
            title: query,
            snippet: topic.Text,
            url: topic.FirstURL || '',
            platform: 'DuckDuckGo'
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

// ============ GitHub 爬虫 ============

/**
 * 搜索 GitHub
 */
export async function searchGitHub(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return (data.items || []).map((repo: any) => ({
      title: repo.full_name,
      snippet: repo.description || '',
      url: repo.html_url,
      platform: 'GitHub'
    }));
  } catch (error) {
    console.error('GitHub search error:', error);
    return [];
  }
}

/**
 * 获取 GitHub 仓库详情
 */
export async function getGitHubRepoInfo(owner: string, repo: string): Promise<{
  stars: number;
  forks: number;
  issues: number;
  lastUpdate: string;
  hasTopics: boolean;
} | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      issues: data.open_issues_count || 0,
      lastUpdate: data.updated_at,
      hasTopics: (data.topics || []).length > 0
    };
  } catch {
    return null;
  }
}

// ============ 工具函数 ============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 通用搜索函数
 */
export async function searchAll(platforms: {
  hn?: boolean;
  reddit?: boolean;
  github?: boolean;
  duckduckgo?: boolean;
}, query: string, limit = 10): Promise<ValidationEvidence[]> {
  const evidence: ValidationEvidence[] = [];
  
  const promises: Promise<void>[] = [];
  
  if (platforms.hn) {
    promises.push(
      searchHackerNews(query, limit).then(results => {
        for (const r of results) {
          evidence.push({
            type: 'positive',
            source: 'HackerNews',
            content: `[${r.title}] ${r.snippet}`,
            url: r.url
          });
        }
      }).catch(() => {})
    );
  }
  
  if (platforms.reddit) {
    promises.push(
      searchReddit(query, limit).then(results => {
        for (const r of results) {
          evidence.push({
            type: 'positive',
            source: 'Reddit',
            content: `[${r.title}] ${r.snippet}`,
            url: r.url
          });
        }
      }).catch(() => {})
    );
  }
  
  if (platforms.github) {
    promises.push(
      searchGitHub(query, limit).then(results => {
        for (const r of results) {
          evidence.push({
            type: 'positive',
            source: 'GitHub',
            content: `[${r.title}] ${r.snippet}`,
            url: r.url
          });
        }
      }).catch(() => {})
    );
  }
  
  if (platforms.duckduckgo) {
    promises.push(
      searchDuckDuckGo(query, limit).then(results => {
        for (const r of results) {
          evidence.push({
            type: 'positive',
            source: 'DuckDuckGo',
            content: `${r.snippet}`,
            url: r.url
          });
        }
      }).catch(() => {})
    );
  }
  
  await Promise.all(promises);
  
  // 添加延迟避免过快请求
  await sleep(500);
  
  return evidence;
}

/**
 * 生成搜索查询建议
 */
export function generateSearchQueries(
  targetUser: string,
  pain: string,
  opportunity: string
): {
  painQueries: string[];
  demandQueries: string[];
  competitorQueries: string[];
  communityQueries: string[];
} {
  const queries = {
    painQueries: [
      pain,
      `${targetUser} problem`,
      `${targetUser} frustrated`,
      `${targetUser} struggle`,
      `hate ${targetUser}`,
      `${targetUser} issues`
    ],
    demandQueries: [
      `best ${opportunity}`,
      `${opportunity} review`,
      `${opportunity} alternative`,
      `${opportunity} free`,
      `${opportunity} comparison`,
      `${opportunity} vs`,
      `how to ${opportunity.toLowerCase()}`
    ],
    competitorQueries: [
      `${opportunity} tool`,
      `${opportunity} software`,
      `${opportunity} app`,
      `${opportunity} github`,
      `open source ${opportunity}`,
      `${opportunity} pricing`
    ],
    communityQueries: [
      `${targetUser} subreddit`,
      `${opportunity} community`,
      `${targetUser} discord`,
      `${targetUser} forum`
    ]
  };
  
  return queries;
}
