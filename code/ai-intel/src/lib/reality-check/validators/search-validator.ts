/**
 * Search Demand Validator - Step 2
 * 
 * 验证用户是否会主动搜索该问题
 * 
 * 检查：
 * - 是否有商业意图的搜索词
 * - 搜索量级别（通过竞品数量推测）
 * - 用户是否会主动寻找解决方案
 */

import { ValidationResult, ValidationEvidence, RealityCheckInput } from './types';
import { searchGitHub, searchReddit, generateSearchQueries } from './scrapers';

export async function validateSearchDemand(input: RealityCheckInput): Promise<ValidationResult> {
  const { targetUser, pain, opportunity } = input;
  const evidence: ValidationEvidence[] = [];
  const risks: string[] = [];
  const searchQueries: string[] = [];
  
  console.log(`[Search Demand] 正在验证搜索需求...`);
  
  try {
    // 生成搜索查询
    const queries = generateSearchQueries(targetUser, pain, opportunity);
    const demandQueries = queries.demandQueries;
    searchQueries.push(...demandQueries);
    
    let totalResults = 0;
    let commercialResults = 0;
    
    // 1. 搜索 GitHub（开源替代品 = 有需求）
    console.log(`[Search Demand] 搜索 GitHub...`);
    for (const query of demandQueries.slice(0, 3)) {
      const ghResults = await searchGitHub(query, 5);
      
      for (const result of ghResults) {
        evidence.push({
          type: 'positive',
          source: 'GitHub',
          content: `[${result.title}] ${result.snippet}`,
          url: result.url
        });
        totalResults++;
        
        // 检查是否有明确的商业意图
        if (result.title.includes('pro') || result.title.includes('paid') || 
            result.title.includes('premium') || result.snippet.includes('free')) {
          commercialResults++;
        }
      }
      
      if (ghResults.length === 0) {
        risks.push(`GitHub 上没有 "${query}" 相关项目`);
      }
    }
    
    // 2. 搜索 Reddit（讨论 = 有需求）
    console.log(`[Search Demand] 搜索 Reddit...`);
    for (const query of demandQueries.slice(0, 3)) {
      const redditResults = await searchReddit(query, 5);
      
      for (const result of redditResults) {
        evidence.push({
          type: 'positive',
          source: 'Reddit',
          content: `[${result.title}] ${result.snippet.substring(0, 150)}`,
          url: result.url
        });
        totalResults++;
        
        // 检查是否有"最佳"、"替代"等高意图词
        if (result.title.toLowerCase().includes('best') || 
            result.title.toLowerCase().includes('alternative') ||
            result.title.toLowerCase().includes('vs')) {
          commercialResults++;
        }
      }
      
      if (redditResults.length === 0) {
        risks.push(`Reddit 上没有 "${query}" 相关讨论`);
      }
    }
    
    // 3. 分析搜索意图类型
    const intentTypes = {
      commercial: ['buy', 'price', 'cost', 'subscription', 'pro', 'premium', 'paid'],
      navigational: ['login', 'sign in', 'app', 'download'],
      informational: ['how to', 'what is', 'tutorial', 'guide', 'review'],
      comparison: ['vs', 'alternative', 'compare', 'better', 'best']
    };
    
    let intentScore = 0;
    const hasCommercial = intentTypes.commercial.some(word => 
      demandQueries.some(q => q.toLowerCase().includes(word))
    );
    const hasComparison = intentTypes.comparison.some(word => 
      demandQueries.some(q => q.toLowerCase().includes(word))
    );
    
    if (hasCommercial) intentScore += 3;
    if (hasComparison) intentScore += 2;
    
    // 计算分数
    let score = 0;
    
    // 基本搜索结果
    if (totalResults > 0) score += 2;
    if (totalResults >= 10) score += 2;
    if (totalResults >= 20) score += 2;
    
    // 商业意图
    score += intentScore;
    
    // 有开源项目 = 需求被验证
    if (commercialResults > 0) score += 1;
    
    // 风险惩罚
    if (risks.length >= 4) score -= 2;
    
    score = Math.max(0, Math.min(10, score));
    
    const conclusion = score >= 7
      ? `✅ 搜索需求强烈：找到 ${totalResults} 条相关结果`
      : score >= 4
        ? `⚠️ 搜索需求中等：找到 ${totalResults} 条结果`
        : `❌ 搜索需求较弱：只有 ${totalResults} 条结果`;
    
    return {
      step: 2,
      name: 'Search Demand Validation',
      score,
      maxScore: 10,
      percentage: score * 10,
      evidence: evidence.slice(0, 20),
      risks,
      conclusion,
      searchQueries
    };
    
  } catch (error) {
    console.error('[Search Demand] Error:', error);
    
    return {
      step: 2,
      name: 'Search Demand Validation',
      score: 0,
      maxScore: 10,
      percentage: 0,
      evidence: [],
      risks: ['验证过程中出错'],
      conclusion: '❌ 验证失败',
      searchQueries
    };
  }
}
