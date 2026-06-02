import { listOpportunities, getOpportunity } from './src/lib/db';

async function main() {
  console.log('📊 海外 AI 工具站套利机会发现系统 - 完整机会列表\n');
  
  // 获取所有机会，按评分降序排列
  const opportunities = listOpportunities({ limit: 200, offset: 0 });
  
  console.log(`📈 总机会数: ${opportunities.length}\n`);
  console.log('='.repeat(120));
  console.log('\n');
  
  // 按优先级分组
  const p0 = opportunities.filter(o => o.priority === 'P0');
  const p1 = opportunities.filter(o => o.priority === 'P1');
  const p2 = opportunities.filter(o => o.priority === 'P2');
  
  console.log(`🔥 P0 极品机会 (≥75分): ${p0.length} 条\n`);
  p0.forEach((o, i) => {
    console.log(`${i + 1}. [${o.score}分] ${o.title}`);
    console.log(`   🎯 目标领域: ${o.target_niche}`);
    console.log(`   💡 痛点分析: ${o.pain_point_analysis}`);
    console.log(`   📌 来源平台: ${o.source_platform}`);
    if (o.blueprint) {
      console.log(`   📋 已生成完整Blueprint ✅`);
    }
    console.log('');
  });
  
  if (p1.length > 0) {
    console.log('='.repeat(120));
    console.log(`\n📈 P1 优秀机会 (60-74分): ${p1.length} 条\n`);
    p1.slice(0, 50).forEach((o, i) => {
      console.log(`${i + 1}. [${o.score}分] ${o.title}`);
      console.log(`   🎯 目标领域: ${o.target_niche}`);
      console.log(`   💡 痛点分析: ${o.pain_point_analysis}`);
      console.log('');
    });
    if (p1.length > 50) {
      console.log(`... 还有 ${p1.length - 50} 条 P1 机会\n`);
    }
  }
  
  if (p2.length > 0) {
    console.log('='.repeat(120));
    console.log(`\n📋 P2 一般机会 (45-59分): ${p2.length} 条\n`);
    p2.slice(0, 20).forEach((o, i) => {
      console.log(`${i + 1}. [${o.score}分] ${o.title}`);
      console.log(`   🎯 目标领域: ${o.target_niche}`);
      console.log('');
    });
    if (p2.length > 20) {
      console.log(`... 还有 ${p2.length - 20} 条 P2 机会\n`);
    }
  }
  
  console.log('='.repeat(120));
  console.log('\n📊 机会细分领域分布统计:\n');
  
  // 统计目标领域分布
  const nicheStats = new Map<string, number>();
  opportunities.forEach(o => {
    const niches = o.target_niche.split(/,|，/).map(n => n.trim());
    niches.forEach(n => {
      if (n) {
        nicheStats.set(n, (nicheStats.get(n) || 0) + 1);
      }
    });
  });
  
  const sortedNiches = Array.from(nicheStats.entries()).sort((a, b) => b[1] - a[1]);
  sortedNiches.slice(0, 20).forEach(([niche, count]) => {
    console.log(`  ${niche}: ${count} 条`);
  });
}

main().catch(console.error);
