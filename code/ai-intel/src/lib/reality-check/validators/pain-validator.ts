/**
 * Pain Validator - Step 1
 * 
 * 验证痛点是否真实存在
 * 
 * 检查：
 * - 真实用户是否在抱怨
 * - 社区是否有相关讨论
 * - 痛点是否有具体描述
 */

import { ValidationResult, ValidationEvidence, RealityCheckInput } from './types';
import { searchHackerNews, searchReddit, generateSearchQueries } from './scrapers';

export async function validatePain(input: RealityCheckInput): Promise<ValidationResult> {
  const { targetUser, pain, opportunity } = input;
  const evidence: ValidationEvidence[] = [];
  const risks: string[] = [];
  const searchQueries: string[] = [];
  
  console.log(`[Pain Validation] 正在验证痛点: ${pain}`);
  
  try {
    // 生成搜索查询
    const queries = generateSearchQueries(targetUser, pain, opportunity);
    const painQueries = queries.painQueries;
    searchQueries.push(...painQueries);
    
    // 1. 搜索 Hacker News
    console.log(`[Pain Validation] 搜索 HN...`);
    for (const query of painQueries.slice(0, 3)) {
      const hnResults = await searchHackerNews(query, 10);
      
      for (const result of hnResults) {
        evidence.push({
          type: result.title.includes(query) ? 'positive' : 'neutral',
          source: 'HackerNews',
          content: `[${result.title}] ${result.snippet.substring(0, 200)}`,
          url: result.url
        });
      }
      
      if (hnResults.length === 0) {
        risks.push(`HN 上没有关于 "${query}" 的讨论`);
      }
    }
    
    // 2. 搜索 Reddit
    console.log(`[Pain Validation] 搜索 Reddit...`);
    for (const query of painQueries.slice(0, 3)) {
      const redditResults = await searchReddit(query, 10);
      
      for (const result of redditResults) {
        evidence.push({
          type: result.title.includes(query) ? 'positive' : 'neutral',
          source: 'Reddit',
          content: `[${result.title}] ${result.snippet.substring(0, 200)}`,
          url: result.url
        });
      }
      
      if (redditResults.length === 0) {
        risks.push(`Reddit 上没有关于 "${query}" 的讨论`);
      }
    }
    
    // 3. 分析痛点质量
    if (pain.length < 20) {
      risks.push('痛点描述太简短，可能不够具体');
    }
    
    if (!pain.includes('want') && !pain.includes('need') && !pain.includes('struggle') && !pain.includes('problem')) {
      risks.push('痛点描述可能不是用户视角');
    }
    
    // 计算分数
    const positiveEvidence = evidence.filter(e => e.type === 'positive').length;
    const totalEvidence = evidence.length;
    
    // 分数计算：
    // - 有 HN 讨论: +2
    // - 有 Reddit 讨论: +2
    // - 讨论数量多: +2
    // - 痛点描述具体: +2
    // - 讨论最近: +2
    
    let score = 0;
    
    // 基本验证
    if (totalEvidence > 0) score += 2;
    if (positiveEvidence > 0) score += 2;
    if (positiveEvidence >= 5) score += 2;
    if (positiveEvidence >= 10) score += 2;
    if (pain.length >= 30) score += 1;
    if (pain.length >= 50) score += 1;
    
    // 检查是否有付费意愿暗示
    const hasPaymentSignal = pain.includes('pay') || pain.includes('cost') || 
                            pain.includes('expensive') || pain.includes('free');
    if (hasPaymentSignal) score += 1;
    
    // 风险惩罚
    if (risks.length >= 3) score -= 2;
    
    score = Math.max(0, Math.min(10, score));
    
    const conclusion = score >= 7
      ? `✅ 痛点验证通过：找到 ${positiveEvidence} 条正面证据`
      : score >= 4
        ? `⚠️ 痛点验证中等：找到 ${positiveEvidence} 条证据，但存在风险`
        : `❌ 痛点验证较弱：只有 ${positiveEvidence} 条证据`;
    
    return {
      step: 1,
      name: 'Pain Validation',
      score,
      maxScore: 10,
      percentage: score * 10,
      evidence: evidence.slice(0, 20), // 限制证据数量
      risks,
      conclusion,
      searchQueries
    };
    
  } catch (error) {
    console.error('[Pain Validation] Error:', error);
    
    return {
      step: 1,
      name: 'Pain Validation',
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
