/**
 * Gap Discovery Engine - Main Entry
 *
 * Silent Harvest V2 架构：
 * 1. Complaint Mining Engine - 收集用户抱怨
 * 2. Gap Discovery Engine - 发现市场缺口
 * 3. Gap Ranking - 对缺口评分
 * 4. MVP Generator - 生成最小产品
 * 5. Founder Filter - 创始人评估
 *
 * 最终只留下：有人付费 + 有人抱怨 + 竞品没有彻底解决 + 我 7 天能做出来
 */

export * from './types';
export * from './complaint-miner';
export * from './gap-discovery';
export * from './mvp-generator';
export * from './founder-filter';

import {
  Complaint,
  MarketGap,
  MVP,
  Competitor,
  RevenueSignal,
  RevenueStrength,
  FinalVerdict,
  GapDiscoveryReport,
} from './types';
import { ComplaintMiner } from './complaint-miner';
import { GapDiscoverer } from './gap-discovery';
import { MVPGenerator } from './mvp-generator';
import { FounderFilter } from './founder-filter';

/**
 * Gap Discovery Pipeline
 */
export class GapDiscoveryPipeline {
  private complaintMiner: ComplaintMiner;
  private gapDiscoverer: GapDiscoverer;
  private mvpGenerator: MVPGenerator;
  private founderFilter: FounderFilter;

  constructor() {
    this.complaintMiner = new ComplaintMiner();
    this.gapDiscoverer = new GapDiscoverer();
    this.mvpGenerator = new MVPGenerator();
    this.founderFilter = new FounderFilter();
  }

  /**
   * Run the full pipeline with manual evidence (for proof mode)
   */
  async runWithManualEvidence(
    opportunity: string,
    whoPays: string[],
    whyTheyPay: string[],
    complaints: Complaint[],
    competitors: Competitor[],
    revenueSignal: RevenueSignal
  ): Promise<GapDiscoveryReport> {
    console.log('='.repeat(80));
    console.log('GAP DISCOVERY PIPELINE');
    console.log('='.repeat(80));

    // Step 1: Discover gaps from complaints
    const gaps = this.gapDiscoverer.discoverGaps(complaints, competitors, revenueSignal);

    // Step 2: Generate MVP for top gap
    const topGap = gaps[0] || null;
    const suggestedMVP = topGap ? this.mvpGenerator.generateMVP(topGap) : null;

    // Step 3: Founder filter
    const founderDecision = topGap
      ? this.founderFilter.personalAssessment(topGap, suggestedMVP)
      : { wouldBuild: false, reason: '没有发现缺口' };

    // Step 4: Final verdict
    const finalVerdict = topGap
      ? this.founderFilter.determineVerdict(
          topGap,
          founderDecision.wouldBuild,
          suggestedMVP
        )
      : FinalVerdict.IGNORE;

    return {
      opportunity,
      whoPays,
      whyTheyPay,
      topCompetitors: competitors,
      revenueSignal,
      topComplaints: complaints,
      marketGaps: gaps,
      topGap,
      suggestedMVP,
      founderFilter: founderDecision,
      finalVerdict,
    };
  }

  /**
   * Print the full report
   */
  printReport(report: GapDiscoveryReport): void {
    console.log('\n');
    console.log('='.repeat(80));
    console.log('GAP DISCOVERY REPORT');
    console.log('='.repeat(80));
    console.log('\n');

    console.log(`OPPORTUNITY: ${report.opportunity}`);
    console.log('\n');

    console.log('WHO PAYS:');
    report.whoPays.forEach((payer, i) => {
      console.log(`  ${i + 1}. ${payer}`);
    });
    console.log('\n');

    console.log('WHY THEY PAY:');
    report.whyTheyPay.forEach((reason, i) => {
      console.log(`  ${i + 1}. ${reason}`);
    });
    console.log('\n');

    console.log('TOP COMPLAINTS:');
    report.topComplaints.forEach((complaint, i) => {
      console.log(`  ${i + 1}. [${complaint.frequency}] ${complaint.complaint}`);
      console.log(`     Severity: ${complaint.severity}`);
      console.log(`     Evidence: ${complaint.evidenceCount} sources`);
      if (complaint.exampleQuotes.length > 0) {
        console.log(`     Quote: "${complaint.exampleQuotes[0]}"`);
      }
      console.log('');
    });

    console.log('TOP COMPETITORS:');
    report.topCompetitors.forEach((comp, i) => {
      console.log(`  ${i + 1}. ${comp.name}`);
      console.log(`     Pricing: ${comp.monthlyPrice ? `$${comp.monthlyPrice}/mo` : 'N/A'} ${comp.oneTimePrice ? `$${comp.oneTimePrice} one-time` : ''}`);
      console.log(`     Positioning: ${comp.positioning}`);
      console.log('');
    });

    console.log('REVENUE SIGNAL:');
    console.log(`  Strength: ${report.revenueSignal.strength}`);
    console.log(`  Has paid plans: ${report.revenueSignal.hasPaidPlans ? 'Yes' : 'No'}`);
    console.log(`  Has enterprise plans: ${report.revenueSignal.hasEnterprisePlans ? 'Yes' : 'No'}`);
    console.log('\n');

    console.log('MARKET GAPS:');
    report.marketGaps.forEach((gap, i) => {
      console.log(`  ${i + 1}. [${gap.gapScore}] ${gap.opportunityName}`);
      console.log(`     Gap: ${gap.marketGap}`);
      console.log(`     Strength: ${gap.strength}`);
      console.log(`     Complaint: ${gap.complaint}`);
      console.log('');
    });

    if (report.topGap) {
      console.log('TOP GAP:');
      console.log(`  ${report.topGap.opportunityName}`);
      console.log(`  Score: ${report.topGap.gapScore}`);
      console.log(`  Gap: ${report.topGap.marketGap}`);
      console.log(`  Why competitors fail: ${report.topGap.whyExistingSolutionsFail}`);
      console.log('\n');
    }

    if (report.suggestedMVP) {
      console.log('SUGGESTED MVP:');
      console.log(`  Product: ${report.suggestedMVP.productName}`);
      console.log(`  Target User: ${report.suggestedMVP.targetUser}`);
      console.log(`  Core Feature: ${report.suggestedMVP.coreFeature}`);
      console.log(`  Pricing: $${report.suggestedMVP.pricing}/mo`);
      console.log(`  Build Time: ${report.suggestedMVP.buildTime} days`);
      console.log(`  Distribution: ${report.suggestedMVP.distributionChannels.join(', ')}`);
      console.log('  MVP Scope:');
      report.suggestedMVP.mvpScope.forEach((scope, i) => {
        console.log(`    ${i + 1}. ${scope}`);
      });
      console.log('');
    }

    console.log('FOUNDER FILTER:');
    console.log(`  Would build: ${report.founderFilter.wouldBuild ? 'YES' : 'NO'}`);
    console.log(`  Reason: ${report.founderFilter.reason}`);
    console.log('\n');

    console.log('FINAL VERDICT:');
    console.log(`  ${report.finalVerdict}`);
    console.log('\n');
  }
}
