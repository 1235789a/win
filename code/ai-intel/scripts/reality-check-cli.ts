/**
 * Reality Check CLI
 * 
 * 手动触发 Reality Check
 * 
 * 使用方法:
 * npx tsx scripts/reality-check-cli.ts
 * npx tsx scripts/reality-check-cli.ts --all-p0
 * npx tsx scripts/reality-check-cli.ts --id 123
 */

import { runRealityCheck, runRealityCheckBatch } from '../src/lib/reality-check';
import { RealityCheckInput } from '../src/lib/reality-check/types';
import { getOpportunityById, listOpportunities } from '../src/lib/db';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * 格式化报告输出
 */
function formatReport(report: any): string {
  let output = '\n';
  output += '═'.repeat(80) + '\n';
  output += colorize('cyan', `  🔍 Reality Check Report`) + '\n';
  output += '═'.repeat(80) + '\n\n';
  
  // 基本信息
  output += colorize('yellow', `📌 Opportunity:`) + ` ${report.opportunity}\n`;
  output += colorize('yellow', `📝 Summary:`) + ` ${report.summary}\n\n`;
  
  // Reality Score
  const scoreColor = report.realityScore >= 70 ? 'green' : report.realityScore >= 40 ? 'yellow' : 'red';
  output += colorize(scoreColor, `🎯 Reality Score: ${report.realityScore}/100`) + '\n';
  output += colorize(scoreColor, `⚖️  Verdict: ${report.verdict}`) + '\n\n';
  
  // 证据统计
  output += '─'.repeat(80) + '\n';
  output += colorize('blue', `📊 Evidence Collected`) + '\n';
  output += '─'.repeat(80) + '\n';
  output += `   总证据数: ${report.realityStats.totalEvidence}\n`;
  output += `   正面证据: ${report.realityStats.positiveEvidence}\n`;
  output += `   负面证据: ${report.realityStats.negativeEvidence}\n`;
  output += `   平均互动: ${report.realityStats.avgEngagement}\n`;
  output += `   发现社区: ${report.realityStats.communitiesFound}\n`;
  output += `   发现竞品: ${report.realityStats.competitorsFound}\n`;
  output += `   付费产品: ${report.realityStats.paidProductsFound}\n\n`;
  
  // 证据来源
  output += colorize('blue', `📍 Evidence Sources`) + '\n';
  output += `   Reddit: ${report.evidence.sources.reddit} 条\n`;
  output += `   HackerNews: ${report.evidence.sources.hackernews} 条\n`;
  output += `   GitHub: ${report.evidence.sources.github} 条\n`;
  output += `   Other: ${report.evidence.sources.other} 条\n\n`;
  
  // 证据强度
  output += colorize('blue', `⚡ Evidence Strength`) + '\n';
  const strengthColors: Record<string, keyof typeof colors> = {
    'Strong': 'green',
    'Medium': 'yellow',
    'Weak': 'yellow',
    'None': 'red'
  };
  output += `   Pain:        ${colorize(strengthColors[report.evidenceStrength.pain], report.evidenceStrength.pain)}\n`;
  output += `   Search:      ${colorize(strengthColors[report.evidenceStrength.search], report.evidenceStrength.search)}\n`;
  output += `   Community:   ${colorize(strengthColors[report.evidenceStrength.community], report.evidenceStrength.community)}\n`;
  output += `   Competitor:  ${colorize(strengthColors[report.evidenceStrength.competitor], report.evidenceStrength.competitor)}\n`;
  output += `   Payment:     ${colorize(strengthColors[report.evidenceStrength.payment], report.evidenceStrength.payment)}\n`;
  output += `   ─────────────────────\n`;
  output += `   Overall:     ${colorize(strengthColors[report.evidenceStrength.overall], report.evidenceStrength.overall)}\n\n`;
  
  // 强证据
  if (report.strongEvidence.length > 0) {
    output += '─'.repeat(80) + '\n';
    output += colorize('green', `✅ Strong Evidence`) + '\n';
    output += '─'.repeat(80) + '\n';
    report.strongEvidence.slice(0, 5).forEach((e: string, i: number) => {
      output += `   ${i + 1}. ${e}\n`;
    });
    output += '\n';
  }
  
  // 弱信号
  if (report.weakSignals.length > 0) {
    output += '─'.repeat(80) + '\n';
    output += colorize('yellow', `⚠️  Weak Signals`) + '\n';
    output += '─'.repeat(80) + '\n';
    report.weakSignals.forEach((s: string, i: number) => {
      output += `   ${i + 1}. ${s}\n`;
    });
    output += '\n';
  }
  
  // 红旗
  if (report.redFlags.length > 0) {
    output += '─'.repeat(80) + '\n';
    output += colorize('red', `🚩 Red Flags`) + '\n';
    output += '─'.repeat(80) + '\n';
    report.redFlags.forEach((f: string, i: number) => {
      output += `   ${i + 1}. ${f}\n`;
    });
    output += '\n';
  }
  
  // 核心判决
  output += '═'.repeat(80) + '\n';
  output += colorize(report.wouldBuild ? 'green' : 'red', `💰 Would Build: ${report.wouldBuild ? 'YES ✅' : 'NO ❌'}`) + '\n';
  output += `   原因: ${report.wouldBuildReason}\n`;
  output += '═'.repeat(80) + '\n';
  output += `\n⏱️  验证耗时: ${report.validationDuration}秒\n`;
  
  return output;
}

/**
 * 从数据库获取 P0 机会
 */
async function getP0Opportunities(): Promise<RealityCheckInput[]> {
  const opportunities = listOpportunities({ limit: 50, minScore: 75 });
  
  return opportunities.map(opp => ({
    opportunity: opp.title,
    targetUser: opp.target_niche || 'Unknown',
    pain: opp.pain_point_analysis || 'Unknown',
    productIdea: opp.blueprint || undefined
  }));
}

/**
 * 从数据库获取单个机会
 */
async function getOpportunityByIdFromDB(id: number): Promise<RealityCheckInput | null> {
  const opp = getOpportunityById(id);
  
  if (!opp) return null;
  
  return {
    opportunity: opp.title,
    targetUser: opp.target_niche || 'Unknown',
    pain: opp.pain_point_analysis || 'Unknown',
    productIdea: opp.blueprint || undefined
  };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  console.log(colorize('cyan', '\n🚀 Reality Check CLI'));
  console.log(colorize('cyan', '   Evidence First, Score Second\n'));
  
  try {
    // 解析参数
    const isAllP0 = args.includes('--all-p0');
    const idArg = args.find(arg => arg.startsWith('--id='));
    const customInput = args.find(arg => arg.startsWith('--opportunity='));
    
    if (isAllP0) {
      // 验证所有 P0 机会
      console.log(colorize('blue', '📋 获取 P0 机会...\n'));
      
      const inputs = await getP0Opportunities();
      
      if (inputs.length === 0) {
        console.log(colorize('yellow', '⚠️  没有找到 P0 机会'));
        return;
      }
      
      console.log(colorize('green', `✅ 找到 ${inputs.length} 个 P0 机会\n`));
      
      const results = await runRealityCheckBatch(inputs, (current, total, result) => {
        const verdictColor = result.verdict === 'BUILD' ? 'green' : result.verdict === 'WATCH' ? 'yellow' : 'red';
        console.log(`[${current}/${total}] ${colorize(verdictColor, result.verdict)} ${result.realityScore}/100 - ${result.opportunity}`);
      });
      
      // 输出汇总
      console.log('\n');
      console.log('═'.repeat(80));
      console.log(colorize('cyan', '📊 Batch Results Summary'));
      console.log('═'.repeat(80));
      
      const buildCount = results.filter(r => r.verdict === 'BUILD').length;
      const watchCount = results.filter(r => r.verdict === 'WATCH').length;
      const ignoreCount = results.filter(r => r.verdict === 'IGNORE').length;
      
      console.log(colorize('green', `   BUILD:  ${buildCount}`));
      console.log(colorize('yellow', `   WATCH:  ${watchCount}`));
      console.log(colorize('red', `   IGNORE: ${ignoreCount}`));
      console.log(`   Total:  ${results.length}`);
      console.log('═'.repeat(80));
      
      // 列出 BUILD 机会
      const buildOpportunities = results.filter(r => r.verdict === 'BUILD');
      if (buildOpportunities.length > 0) {
        console.log('\n');
        console.log(colorize('green', '🎯 BUILD Opportunities:'));
        buildOpportunities.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.opportunity} (${r.realityScore}/100)`);
        });
      }
      
    } else if (idArg) {
      // 验证指定 ID
      const id = parseInt(idArg.split('=')[1], 10);
      console.log(colorize('blue', `📋 获取机会 #${id}...\n`));
      
      const input = await getOpportunityByIdFromDB(id);
      
      if (!input) {
        console.log(colorize('red', `❌ 找不到 ID 为 ${id} 的机会`));
        return;
      }
      
      const report = await runRealityCheck(input);
      console.log(formatReport(report));
      
    } else if (customInput) {
      // 自定义机会输入
      const opportunityText = customInput.split('=')[1].replace(/_/g, ' ');
      console.log(colorize('blue', `📋 验证自定义机会: ${opportunityText}\n`));
      
      const report = await runRealityCheck({
        opportunity: opportunityText,
        targetUser: 'Users',
        pain: `Problem with ${opportunityText}`
      });
      
      console.log(formatReport(report));
      
    } else {
      // 交互模式
      console.log(colorize('yellow', '使用方法:'));
      console.log('   --all-p0              验证所有 P0 机会');
      console.log('   --id=123              验证指定 ID');
      console.log('   --opportunity=Name    验证自定义机会\n');
      
      // 默认验证第一个 P0
      const inputs = await getP0Opportunities();
      
      if (inputs.length > 0) {
        console.log(colorize('blue', '📋 验证第一个 P0 机会...\n'));
        const report = await runRealityCheck(inputs[0]);
        console.log(formatReport(report));
      } else {
        console.log(colorize('yellow', '⚠️  没有找到 P0 机会'));
      }
    }
    
  } catch (error) {
    console.error(colorize('red', '\n❌ Error:'), error);
  }
}

// 运行
main();
