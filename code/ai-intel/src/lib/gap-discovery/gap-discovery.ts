/**
 * Gap Discovery Engine
 *
 * 根据 Complaint 自动寻找：未被满足需求
 *
 * 不要问：用户需要什么
 * 要问：用户讨厌什么 → 用户抱怨什么 → 竞品没有解决什么 → 机会在哪里
 */

import {
  Complaint,
  MarketGap,
  GapStrength,
  GapScoreDimensions,
  FinalVerdict,
  MVP,
  Competitor,
  RevenueSignal,
  RevenueStrength,
} from './types';

/**
 * Gap Discovery Engine
 */
export class GapDiscoverer {
  /**
   * Discover market gaps from complaints
   */
  discoverGaps(
    complaints: Complaint[],
    competitors: Competitor[] = [],
    revenueSignal: RevenueSignal
  ): MarketGap[] {
    console.log(`[GapDiscoverer] Discovering gaps from ${complaints.length} complaints...`);

    const gaps: MarketGap[] = [];

    for (const complaint of complaints) {
      const gap = this.discoverGapFromComplaint(complaint, competitors);
      if (gap) {
        gap.gapScore = this.calculateGapScore(gap, revenueSignal);
        gaps.push(gap);
      }
    }

    // Sort by gap score descending
    gaps.sort((a, b) => b.gapScore - a.gapScore);

    console.log(`[GapDiscoverer] Found ${gaps.length} gaps`);

    return gaps;
  }

  /**
   * Discover a single market gap from a complaint
   */
  private discoverGapFromComplaint(
    complaint: Complaint,
    competitors: Competitor[]
  ): MarketGap | null {
    // Identify what the complaint is about
    const complaintText = complaint.complaint.toLowerCase();

    // Map complaints to potential solutions
    const gap = this.mapComplaintToGap(complaint, competitors);

    return gap;
  }

  /**
   * Map a complaint to a potential market gap
   */
  private mapComplaintToGap(
    complaint: Complaint,
    competitors: Competitor[]
  ): MarketGap | null {
    const complaintText = complaint.complaint.toLowerCase();

    // Determine gap strength based on complaint severity and frequency
    const strength = this.calculateStrength(complaint);

    // Map common complaints to gaps
    if (complaintText.includes('templated') || complaintText.includes('template') || complaintText.includes('too robotic') || complaintText.includes('fake')) {
      return {
        complaint: complaint.complaint,
        currentSolutions: this.findCompetitorsWithProblem(competitors, ['template', 'robotic']),
        whyExistingSolutionsFail: 'Current solutions only do variable substitution, lack real context understanding, making content look robotic and fake',
        marketGap: 'Context-aware personalized content generation',
        opportunityName: 'Context-Aware Personalization Engine',
        strength,
        gapScore: 0,
      };
    }

    if (complaintText.includes('ban') || complaintText.includes('banned') || complaintText.includes('detect') || complaintText.includes('detection')) {
      return {
        complaint: complaint.complaint,
        currentSolutions: this.findCompetitorsWithProblem(competitors, ['banned', 'detection']),
        whyExistingSolutionsFail: 'Current automation tools leave obvious machine footprints, easily detected and banned by platforms',
        marketGap: 'Anti-detection human behavior simulation',
        opportunityName: 'Anti-Detection Human Behavior Simulator',
        strength,
        gapScore: 0,
      };
    }

    if (complaintText.includes('reply') || complaintText.includes('response') || complaintText.includes('ineffective') || complaintText.includes('useless')) {
      return {
        complaint: complaint.complaint,
        currentSolutions: this.findCompetitorsWithProblem(competitors, ['ineffective', 'useless']),
        whyExistingSolutionsFail: 'Current tools only focus on sending volume, not optimizing for results, leading to very low reply rates',
        marketGap: 'Reply rate optimization engine',
        opportunityName: 'Response Rate Optimization Engine',
        strength,
        gapScore: 0,
      };
    }

    if (complaintText.includes('expens') || complaintText.includes('price') || complaintText.includes('cost')) {
      return {
        complaint: complaint.complaint,
        currentSolutions: this.findCompetitorsWithProblem(competitors, ['expensive', 'price']),
        whyExistingSolutionsFail: 'Current tools are priced too high, unaffordable for small and medium users',
        marketGap: 'Usage-based lightweight tools',
        opportunityName: 'Usage-Based Lightweight Tool',
        strength,
        gapScore: 0,
      };
    }

    if (complaintText.includes('support') || complaintText.includes('customer service') || complaintText.includes('ignored')) {
      return {
        complaint: complaint.complaint,
        currentSolutions: this.findCompetitorsWithProblem(competitors, ['support', 'customer service']),
        whyExistingSolutionsFail: 'Current tools have slow customer support responses, bad attitude, and can\'t solve problems',
        marketGap: 'High-response customer support service',
        opportunityName: 'High-Response Customer Support Service',
        strength,
        gapScore: 0,
      };
    }

    // Generic gap for other complaints
    return {
      complaint: complaint.complaint,
      currentSolutions: competitors.map(c => c.name),
      whyExistingSolutionsFail: 'Current solutions fail to solve this problem',
      marketGap: `Product that solves "${complaint.complaint}"`,
      opportunityName: `Problem Solver for "${complaint.complaint}"`,
      strength,
      gapScore: 0,
    };
  }

  /**
   * Find competitors that have the mentioned problem
   */
  private findCompetitorsWithProblem(
    competitors: Competitor[],
    keywords: string[]
  ): string[] {
    return competitors
      .filter(c => {
        const nameLower = c.name.toLowerCase();
        return keywords.some(k => nameLower.includes(k));
      })
      .map(c => c.name);
  }

  /**
   * Calculate gap strength
   */
  private calculateStrength(complaint: Complaint): GapStrength {
    let score = 0;

    // Higher severity = stronger gap
    if (complaint.severity === 'High') score += 2;
    if (complaint.severity === 'Medium') score += 1;

    // Higher frequency = stronger gap
    if (complaint.frequency === 'VeryHigh') score += 2;
    if (complaint.frequency === 'High') score += 1;

    if (score >= 3) return GapStrength.VeryHigh;
    if (score >= 2) return GapStrength.High;
    if (score >= 1) return GapStrength.Medium;
    return GapStrength.Low;
  }

  /**
   * Calculate gap score (0-100)
   */
  private calculateGapScore(
    gap: MarketGap,
    revenueSignal: RevenueSignal
  ): number {
    let score = 0;

    // Check if this is a generic gap (Problem Solver) - we want to prioritize specific gaps
    const isGeneric = gap.opportunityName.startsWith('Problem Solver for');

    // Severity - up to 20 points
    const severityScore = this.getSeverityScore(gap.strength);
    score += severityScore;

    // Revenue signal - up to 20 points
    const revenueScore = this.getRevenueScore(revenueSignal);
    score += revenueScore;

    // Competition density - if competitors exist but fail to solve it, that's good
    const competitionScore = gap.currentSolutions.length > 0 ? 15 : 5;
    score += competitionScore;

    // Solo buildability - can a single founder build this?
    // We'll assume yes for most gaps in our scope
    score += 15;

    // GEO potential - can this expand to multiple markets?
    score += 15;

    // Bonus for high complaint frequency
    score += Math.min(gap.strength === 'VeryHigh' ? 10 : 5, 10);

    // Bonus for being a specific, non-generic gap!
    if (!isGeneric) {
      score += 15; // Big bonus for specific gaps that we have a clear solution for
    } else {
      score -= 5; // Small penalty for generic gaps
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Get severity score
   */
  private getSeverityScore(strength: GapStrength): number {
    switch (strength) {
      case GapStrength.VeryHigh:
        return 20;
      case GapStrength.High:
        return 16;
      case GapStrength.Medium:
        return 12;
      case GapStrength.Low:
        return 6;
      default:
        return 4;
    }
  }

  /**
   * Get revenue score
   */
  private getRevenueScore(revenueSignal: RevenueSignal): number {
    switch (revenueSignal.strength) {
      case RevenueStrength.Strong:
        return 20;
      case RevenueStrength.Medium:
        return 15;
      case RevenueStrength.Weak:
        return 8;
      default:
        return 4;
    }
  }
}
