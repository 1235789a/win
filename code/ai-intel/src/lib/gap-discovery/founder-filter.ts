/**
 * Founder Filter
 *
 * Most important module.
 *
 * For every Gap, answer: If I was alone, had only 7 days, and only $300, would I build this?
 *
 * Output: YES / NO + Reason
 */

import { MarketGap, MVP, FinalVerdict } from './types';

/**
 * Founder Filter
 */
export class FounderFilter {
  /**
   * Should a solo founder build this?
   */
  shouldBuild(gap: MarketGap, mvp: MVP | null): { shouldBuild: boolean; reason: string } {
    console.log(`[FounderFilter] Evaluating: ${gap.opportunityName}`);

    const redFlags: string[] = [];
    const greenFlags: string[] = [];

    // Risk checks
    if (!mvp) {
      redFlags.push('Cannot generate feasible MVP plan');
    } else {
      // Check build time
      if (mvp.buildTime > 14) {
        redFlags.push(`Build time exceeds 14 days (${mvp.buildTime} days), too long for solo founder`);
      } else if (mvp.buildTime <= 7) {
        greenFlags.push('MVP can be built in 7 days, quick validation');
      }

      // Check pricing
      if (mvp.pricing < 10) {
        greenFlags.push('Low price point, lower user barrier to try');
      } else if (mvp.pricing > 50) {
        redFlags.push('Price too high, may be hard to convince users to pay');
      }

      // Check distribution channels
      if (mvp.distributionChannels.length >= 2) {
        greenFlags.push('Multiple clear distribution channels');
      }
    }

    // Check gap specific factors
    if (gap.strength === 'VeryHigh' || gap.strength === 'High') {
      greenFlags.push('Strong user complaints, real pain points');
    }

    if (gap.currentSolutions.length > 0) {
      greenFlags.push('Competitors exist proving market is real, and competitors haven\'t solved the problem');
    }

    // Check if it's in a risky category
    if (this.isRiskyCategory(gap.opportunityName)) {
      redFlags.push('High-risk category, may get banned or regulated by platforms');
    }

    // Final decision
    if (redFlags.length > greenFlags.length) {
      return {
        shouldBuild: false,
        reason: `Not recommended. Red flags (${redFlags.length}) exceed green flags (${greenFlags.length}). Problems: ${redFlags.join('; ')}`,
      };
    }

    // Green flags are good
    if (greenFlags.length >= 2) {
      return {
        shouldBuild: true,
        reason: `Worth building. Green flags: ${greenFlags.join('; ')}. Potential issues: ${redFlags.length > 0 ? redFlags.join('; ') : 'No obvious issues'}`,
      };
    }

    // Neutral case
    return {
      shouldBuild: false,
      reason: `Cautious observation. Green flags: ${greenFlags.join('; ')}. Problems: ${redFlags.join('; ')}. More validation needed.`,
    };
  }

  /**
   * Determine final verdict
   */
  determineVerdict(
    gap: MarketGap,
    shouldBuild: boolean,
    mvp: MVP | null
  ): FinalVerdict {
    if (!shouldBuild) {
      return FinalVerdict.IGNORE;
    }

    if (gap.gapScore >= 80) {
      return FinalVerdict.BUILD;
    }

    if (gap.gapScore >= 50) {
      return FinalVerdict.WATCH;
    }

    return FinalVerdict.IGNORE;
  }

  /**
   * Check if it's a risky category
   */
  private isRiskyCategory(name: string): boolean {
    const riskyKeywords = [
      'hacking',
      'cracking',
      'phishing',
      'spam',
      'scam',
      'automation linkedin',
      'automation facebook',
      'automation instagram',
      'bot detection bypass',
    ];

    const lowerName = name.toLowerCase();

    return riskyKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Generate personal assessment
   */
  personalAssessment(
    gap: MarketGap,
    mvp: MVP | null
  ): {
    wouldBuild: boolean;
    reason: string;
  } {
    if (!mvp) {
      return {
        wouldBuild: false,
        reason: 'No feasible MVP plan, will not invest',
      };
    }

    // 7-day check
    if (mvp.buildTime > 14) {
      return {
        wouldBuild: false,
        reason: `Building takes ${mvp.buildTime} days, exceeding 14-day solo build limit, too long`,
      };
    }

    // Check if it fits solo founder constraints
    const isSoloBuildable = mvp.buildTime <= 14;
    const isAffordable = true; // Assume $300 budget is enough for SaaS

    if (isSoloBuildable && isAffordable && gap.gapScore >= 60) {
      return {
        wouldBuild: true,
        reason: `Will build. Can complete MVP in ${mvp.buildTime} days, priced at $${mvp.pricing}/month, with clear distribution channels: ${mvp.distributionChannels.join(', ')}${mvp.buildTime <= 7 ? ' Great opportunity for quick validation!' : ''}`,
      };
    }

    return {
      wouldBuild: false,
      reason: `Will not build. Reason: ${mvp.buildTime > 14 ? 'Build time too long' : gap.gapScore < 60 ? 'Gap score not high enough' : 'other factors'}. Recommend observing or finding better opportunities.`,
    };
  }
}
