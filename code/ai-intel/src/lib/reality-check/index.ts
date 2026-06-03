/**
 * Reality Check - 主程序
 * 
 * Evidence First, Score Second
 * 
 * 流程：
 * 1. 生成搜索查询
 * 2. 收集真实证据
 * 3. 分析证据强度
 * 4. 生成判决
 */

import {
  RealityCheckInput,
  RealityCheckReport,
  EvidenceCollection,
  Evidence,
  VERDICT_RULES
} from './types';
import {
  collectEvidence,
  generateQueries
} from './scrapers';

/**
 * 核心 Reality Check 函数
 */
export async function runRealityCheck(input: RealityCheckInput): Promise<RealityCheckReport> {
  const startTime = Date.now();
  console.log(`\n🚀 开始 Reality Check: ${input.opportunity}`);
  console.log(`   目标用户: ${input.targetUser}`);
  console.log(`   痛点: ${input.pain}`);
  
  // Step 1: 生成查询
  const queries = generateQueries(
    input.opportunity,
    input.targetUser,
    input.pain
  );
  
  console.log('\n📝 Step 1: 生成搜索查询完成');
  
  // Step 2: 收集证据（按类型分组）
  console.log('\n🔍 Step 2: 开始收集证据...');
  
  const [painEvidence, searchEvidence, competitorEvidence, communityEvidence] = await Promise.all([
    collectEvidence(queries.painQueries, { limitPerSource: 15 }),
    collectEvidence(queries.demandQueries, { limitPerSource: 15 }),
    collectEvidence(queries.competitorQueries, { limitPerSource: 15 }),
    collectEvidence(queries.communityQueries, { limitPerSource: 10 })
  ]);
  
  console.log(`   痛点证据: ${painEvidence.length} 条`);
  console.log(`   搜索需求证据: ${searchEvidence.length} 条`);
  console.log(`   竞品证据: ${competitorEvidence.length} 条`);
  console.log(`   社区证据: ${communityEvidence.length} 条`);
  
  // 付费证据从竞品中提取
  const paymentEvidence = competitorEvidence.filter(e => 
    e.additionalData?.includes('$') || 
    e.title.toLowerCase().includes('pro') ||
    e.title.toLowerCase().includes('paid') ||
    e.title.toLowerCase().includes('premium')
  );
  
  // 构建证据集合
  const evidenceCollection: EvidenceCollection = {
    painEvidence,
    searchEvidence,
    communityEvidence,
    competitorEvidence,
    paymentEvidence,
    totalEvidence: painEvidence.length + searchEvidence.length + competitorEvidence.length + communityEvidence.length,
    sources: {
      reddit: [
        ...painEvidence,
        ...searchEvidence,
        ...competitorEvidence,
        ...communityEvidence
      ].filter(e => e.source.startsWith('r/')).length,
      hackernews: [
        ...painEvidence,
        ...searchEvidence,
        ...competitorEvidence,
        ...communityEvidence
      ].filter(e => e.source === 'HackerNews').length,
      github: competitorEvidence.filter(e => e.source === 'GitHub').length,
      other: [
        ...painEvidence,
        ...searchEvidence,
        ...competitorEvidence,
        ...communityEvidence
      ].filter(e => 
        !e.source.startsWith('r/') && 
        e.source !== 'HackerNews' && 
        e.source !== 'GitHub'
      ).length
    }
  };
  
  // Step 3: 分析证据强度
  console.log('\n📊 Step 3: 分析证据强度...');
  
  const evidenceStrength = {
    pain: analyzeStrength(painEvidence),
    search: analyzeStrength(searchEvidence),
    community: analyzeStrength(communityEvidence),
    competitor: analyzeStrength(competitorEvidence),
    payment: analyzeStrength(paymentEvidence),
    overall: 'None' as 'Strong' | 'Medium' | 'Weak' | 'None'
  };
  
  // 计算整体强度
  const strengthOrder = { 'Strong': 4, 'Medium': 3, 'Weak': 2, 'None': 1 };
  const avgStrength = (
    strengthOrder[evidenceStrength.pain] +
    strengthOrder[evidenceStrength.search] +
    strengthOrder[evidenceStrength.competitor] +
    strengthOrder[evidenceStrength.payment]
  ) / 4;
  
  if (avgStrength >= 3.5) evidenceStrength.overall = 'Strong';
  else if (avgStrength >= 2.5) evidenceStrength.overall = 'Medium';
  else if (avgStrength >= 1.5) evidenceStrength.overall = 'Weak';
  else evidenceStrength.overall = 'None';
  
  // Step 4: 统计真实数据
  const allEvidence = [
    ...painEvidence,
    ...searchEvidence,
    ...competitorEvidence,
    ...communityEvidence
  ];
  
  const realityStats = {
    totalEvidence: allEvidence.length,
    positiveEvidence: allEvidence.filter(e => e.type === 'positive').length,
    negativeEvidence: allEvidence.filter(e => e.type === 'negative').length,
    communitiesFound: new Set(communityEvidence.map(e => e.source)).size,
    competitorsFound: competitorEvidence.length,
    paidProductsFound: paymentEvidence.length,
    avgEngagement: allEvidence.length > 0
      ? Math.round(allEvidence.reduce((sum, e) => sum + (e.engagement || 0), 0) / allEvidence.length)
      : 0
  };
  
  // Step 5: 提取强证据和弱信号
  const strongEvidence = allEvidence
    .filter(e => (e.engagement || 0) >= 50)
    .slice(0, 10)
    .map(e => `[${e.source}] ${e.title} (${e.engagement} 互动)`);
  
  const weakSignals: string[] = [];
  if (painEvidence.length < 3) weakSignals.push('痛点讨论较少');
  if (searchEvidence.length < 3) weakSignals.push('搜索需求证据不足');
  if (communityEvidence.length < 2) weakSignals.push('缺乏活跃社区');
  if (competitorEvidence.length === 0) weakSignals.push('未找到竞品');
  if (paymentEvidence.length === 0) weakSignals.push('未找到付费产品');
  
  // Step 6: 红旗检测
  const redFlags: string[] = [];
  
  if (painEvidence.length === 0 && searchEvidence.length === 0) {
    redFlags.push('完全没有真实讨论 - 高概率 AI 幻觉');
  }
  
  if (competitorEvidence.length === 0 && painEvidence.length < 5) {
    redFlags.push('没有竞品 + 痛点讨论少 = 可能不存在市场需求');
  }
  
  if (paymentEvidence.length === 0 && competitorEvidence.length === 0) {
    redFlags.push('没有付费证据 = 无法验证商业可行性');
  }
  
  if (input.opportunity.includes('AI') && input.opportunity.length < 15) {
    redFlags.push('机会名称过于宽泛，可能是 AI 关键词堆砌');
  }
  
  // Step 7: 计算 Reality Score（简单算法）
  let realityScore = 0;
  
  // 证据数量（最多 40 分）
  realityScore += Math.min(allEvidence.length, 40);
  
  // 付费证据（最多 20 分）
  realityScore += paymentEvidence.length * 5;
  
  // 高互动证据（最多 20 分）
  const highEngagementCount = allEvidence.filter(e => (e.engagement || 0) >= 100).length;
  realityScore += Math.min(highEngagementCount * 4, 20);
  
  // 竞品存在（最多 10 分）
  if (competitorEvidence.length > 0) realityScore += 10;
  
  // 社区存在（最多 10 分）
  if (realityStats.communitiesFound > 0) realityScore += 10;
  
  realityScore = Math.min(100, realityScore);
  
  // Step 8: 最终判决
  let verdict: 'BUILD' | 'WATCH' | 'IGNORE' = 'IGNORE';
  
  if (
    realityScore >= VERDICT_RULES.BUILD.minScore &&
    allEvidence.length >= VERDICT_RULES.BUILD.minEvidence &&
    (evidenceStrength.pain === 'Strong' || evidenceStrength.pain === 'Medium') &&
    (evidenceStrength.payment === 'Strong' || evidenceStrength.payment === 'Medium' || evidenceStrength.payment === 'Weak')
  ) {
    verdict = 'BUILD';
  } else if (
    realityScore >= VERDICT_RULES.WATCH.minScore &&
    allEvidence.length >= VERDICT_RULES.WATCH.minEvidence &&
    (evidenceStrength.pain === 'Strong' || evidenceStrength.pain === 'Medium' || evidenceStrength.pain === 'Weak')
  ) {
    verdict = 'WATCH';
  } else {
    verdict = 'IGNORE';
  }
  
  // 红旗惩罚
  if (redFlags.length >= 2) {
    verdict = 'IGNORE';
    realityScore = Math.max(0, realityScore - 30);
  }
  
  // Step 9: 核心问题回答
  const wouldBuild = verdict === 'BUILD';
  const wouldBuildReason = wouldBuild
    ? `找到 ${allEvidence.length} 条证据，其中 ${highEngagementCount} 条高互动证据。存在 ${competitorEvidence.length} 个竞品，${paymentEvidence.length} 个付费产品。`
    : redFlags.length >= 2
      ? `发现 ${redFlags.length} 个红旗，高概率 AI 幻觉。`
      : allEvidence.length < 5
        ? `证据不足（${allEvidence.length} 条），无法验证市场需求。`
        : evidenceStrength.payment === 'None'
          ? `未找到付费证据，商业可行性存疑。`
          : `虽然有一些证据，但综合判断风险较高。`;
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  // 生成总结
  const summary = `${verdict === 'BUILD' ? '✅' : verdict === 'WATCH' ? '⚠️' : '❌'} 收集到 ${allEvidence.length} 条证据，` +
    `其中包含 ${paymentEvidence.length} 个付费产品、` +
    `${competitorEvidence.length} 个竞品、` +
    `${realityStats.communitiesFound} 个活跃社区。` +
    `Reality Score: ${realityScore}/100`;
  
  console.log(`\n✅ Reality Check 完成 (${duration}秒)`);
  console.log(`   判决: ${verdict}`);
  console.log(`   Reality Score: ${realityScore}/100`);
  
  return {
    opportunity: input.opportunity,
    summary,
    evidence: evidenceCollection,
    evidenceStrength,
    realityStats,
    strongEvidence,
    weakSignals,
    redFlags,
    verdict,
    realityScore,
    wouldBuild,
    wouldBuildReason,
    createdAt: new Date(),
    validationDuration: duration
  };
}

/**
 * 分析证据强度
 */
function analyzeStrength(evidence: Evidence[]): 'Strong' | 'Medium' | 'Weak' | 'None' {
  if (evidence.length === 0) return 'None';
  
  const highEngagement = evidence.filter(e => (e.engagement || 0) >= 50).length;
  
  if (evidence.length >= 10 && highEngagement >= 5) return 'Strong';
  if (evidence.length >= 5 && highEngagement >= 2) return 'Medium';
  if (evidence.length >= 2) return 'Weak';
  return 'None';
}

/**
 * 验证多个机会
 */
export async function runRealityCheckBatch(
  opportunities: RealityCheckInput[],
  onProgress?: (current: number, total: number, result: RealityCheckReport) => void
): Promise<RealityCheckReport[]> {
  const results: RealityCheckReport[] = [];
  
  for (let i = 0; i < opportunities.length; i++) {
    console.log(`\n[${i + 1}/${opportunities.length}] 处理中...`);
    
    const result = await runRealityCheck(opportunities[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, opportunities.length, result);
    }
    
    // 每个机会之间暂停，避免 API 限制
    if (i < opportunities.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
