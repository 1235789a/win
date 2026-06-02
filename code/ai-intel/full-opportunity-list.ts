import { listOpportunities, getOpportunity } from './src/lib/db';

async function main() {
  console.log('='.repeat(120));
  console.log('📊 海外 AI 工具站套利机会发现系统 - 完整情报列表');
  console.log('='.repeat(120));
  console.log('');
  
  const opportunities = listOpportunities({ limit: 200, offset: 0 });
  
  console.log(`📈 总机会数: ${opportunities.length}`);
  console.log(`💰 平均分数: ${Math.round(opportunities.reduce((sum, o) => sum + o.score, 0) / opportunities.length)}`);
  console.log('');
  
  const p0 = opportunities.filter(o => o.priority === 'P0');
  const p1 = opportunities.filter(o => o.priority === 'P1');
  const p2 = opportunities.filter(o => o.priority === 'P2');
  
  console.log('='.repeat(120));
  console.log('🔥 P0 极品机会 (≥75分) - 立即动手');
  console.log('='.repeat(120));
  console.log('');
  
  p0.forEach((o, i) => {
    console.log(`${i+1}. [${o.score}分] ${o.title}`);
    console.log(`   🎯 目标领域: ${o.target_niche}`);
    console.log(`   💡 痛点分析: ${o.pain_point_analysis}`);
    console.log(`   📌 来源: ${o.source_platform}`);
    console.log(`   📋 Blueprint: ${o.blueprint ? '✅ 已生成' : '❌ 未生成'}`);
    if (o.blueprint) {
      const preview = o.blueprint.substring(0, 200);
      console.log(`   📄 Blueprint预览: ${preview}...`);
    }
    console.log('');
  });
  
  console.log('='.repeat(120));
  console.log('📈 P1 优秀机会 (60-74分) - 值得做');
  console.log('='.repeat(120));
  console.log('');
  
  p1.forEach((o, i) => {
    console.log(`${i+1}. [${o.score}分] ${o.title}`);
    console.log(`   🎯 目标领域: ${o.target_niche}`);
    console.log(`   💡 痛点分析: ${o.pain_point_analysis}`);
    if (o.blueprint) {
      console.log(`   📋 Blueprint: ✅ 已生成`);
    }
    console.log('');
  });
  
  console.log('='.repeat(120));
  console.log('📊 细分领域统计');
  console.log('='.repeat(120));
  
  const nicheStats = new Map<string, number>();
  opportunities.forEach(o => {
    const niches = o.target_niche.split(/,|，/).map(n => n.trim());
    niches.forEach(n => {
      if (n) {
        nicheStats.set(n, (nicheStats.get(n) || 0) + 1);
      }
    });
  });
  
  console.log('');
  Array.from(nicheStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([niche, count]) => {
      console.log(`  ${'▇'.repeat(count)} ${niche} (${count})`);
    });
  
  console.log('');
  console.log('='.repeat(120));
  console.log('💡 套利特点');
  console.log('='.repeat(120));
  console.log('');
  console.log('✅ 以开发者工具为主，竞争相对较小');
  console.log('✅ 大量AI Agent相关工具，市场增长快');
  console.log('✅ 适合USDT收款的加密货币工具');
  console.log('✅ 多数可在2-4周内完成MVP');
  console.log('✅ 都有明确的付费意愿和痛点');
}

main().catch(console.error);
