/**
 * MVP Generator
 *
 * 目标：自动生成最小产品
 *
 * 输入：Market Gap
 * 输出：Product Name, Target User, Core Feature, Pricing, MVP Scope, Build Time, Distribution Channel, GEO Topics
 */

import { MarketGap, MVP, GapStrength } from './types';

/**
 * MVP Generator
 */
export class MVPGenerator {
  /**
   * Generate an MVP from a market gap
   */
  generateMVP(gap: MarketGap): MVP | null {
    console.log(`[MVPGenerator] Generating MVP for: ${gap.opportunityName}`);

    // Skip weak gaps
    if (gap.strength === GapStrength.Low || gap.strength === GapStrength.VeryLow) {
      console.log('[MVPGenerator] Skipping weak gap');
      return null;
    }

    // Generate based on gap type
    const mvp = this.generateFromGapType(gap);

    return mvp;
  }

  /**
   * Generate MVP from gap type
   */
  private generateFromGapType(gap: MarketGap): MVP {
    const gapName = gap.opportunityName.toLowerCase();

    // Context-aware personalization
    if (gapName.includes('context') || gapName.includes('personalization')) {
      return this.generateContextAwareMVP(gap);
    }

    // Anti-detection
    if (gapName.includes('anti-detect') || gapName.includes('反检测')) {
      return this.generateAntiDetectionMVP(gap);
    }

    // Response rate optimization
    if (gapName.includes('response') || gapName.includes('回复率')) {
      return this.generateResponseRateMVP(gap);
    }

    // Usage-based pricing
    if (gapName.includes('usage') || gapName.includes('按使用')) {
      return this.generateUsageBasedMVP(gap);
    }

    // Customer support
    if (gapName.includes('support') || gapName.includes('客服')) {
      return this.generateSupportMVP(gap);
    }

    // Generic MVP
    return this.generateGenericMVP(gap);
  }

  /**
   * Generate context-aware personalization MVP
   */
  private generateContextAwareMVP(gap: MarketGap): MVP {
    return {
      productName: 'ContextAware',
      targetUser: 'Indie developers, SDRs, users of AI content generation',
      coreFeature: 'Generate personalized content based on real context',
      pricing: 19,
      mvpScope: [
        'Analyze target user social media/website content',
        'Extract real information points',
        'Generate personalized messages with context',
        'Provide message quality scoring',
      ],
      buildTime: 7,
      distributionChannels: ['Twitter/X', 'Reddit', 'IndieHackers'],
      geoTopics: [
        'how to improve cold email response rate',
        'personalization tactics for outreach',
        'AI copywriting tools',
        'better cold email openers',
      ],
    };
  }

  /**
   * Generate anti-detection MVP
   */
  private generateAntiDetectionMVP(gap: MarketGap): MVP {
    return {
      productName: 'HumanSim',
      targetUser: 'Automation developers, SDR teams',
      coreFeature: 'Automation tool that simulates real human behavior',
      pricing: 29,
      mvpScope: [
        'Randomized mouse movement trajectory',
        'Human-like keyboard input delays',
        'Page scrolling simulation',
        'Randomized time intervals between actions',
        'Anti-detection scoring system',
      ],
      buildTime: 10,
      distributionChannels: ['GitHub', 'Discord', 'Reddit', 'ProductHunt'],
      geoTopics: [
        'avoiding automation detection',
        'undetectable browser automation',
        'how to prevent being banned',
        'bot detection techniques',
      ],
    };
  }

  /**
   * Generate response rate optimization MVP
   */
  private generateResponseRateMVP(gap: MarketGap): MVP {
    return {
      productName: 'ReplyBoost',
      targetUser: 'SDRs, salespeople, indie developers doing cold outreach',
      coreFeature: 'Optimize messages to improve reply rates',
      pricing: 24,
      mvpScope: [
        'Message quality scoring',
        'Reply rate prediction',
        'A/B testing capabilities',
        'Reply rate statistics',
        'Optimization suggestions',
      ],
      buildTime: 8,
      distributionChannels: ['LinkedIn', 'Twitter/X', 'Reddit r/sales'],
      geoTopics: [
        'improve cold email response rate',
        'outreach optimization',
        'sales copywriting tips',
        'how to get more replies',
      ],
    };
  }

  /**
   * Generate usage-based pricing MVP
   */
  private generateUsageBasedMVP(gap: MarketGap): MVP {
    return {
      productName: 'PayAsYouGo Tools',
      targetUser: 'Budget-conscious small/medium users, indie developers',
      coreFeature: 'Lightweight tools with usage-based pricing',
      pricing: 9,
      mvpScope: [
        'Usage-based billing',
        'Transparent pricing display',
        'Monthly usage reports',
        'Spending alerts',
        'Simple subscription cancellation',
      ],
      buildTime: 6,
      distributionChannels: ['ProductHunt', 'HackerNews', 'IndieHackers'],
      geoTopics: [
        'affordable SaaS tools',
        'pay as you go pricing',
        'cheap alternatives',
        'budget-friendly software',
      ],
    };
  }

  /**
   * Generate customer support MVP
   */
  private generateSupportMVP(gap: MarketGap): MVP {
    return {
      productName: 'FastSupport',
      targetUser: 'Users needing timely customer support',
      coreFeature: 'High response speed customer support',
      pricing: 29,
      mvpScope: [
        'Real-time chat',
        '30-minute response guarantee',
        'Knowledge base Q&A',
        'Ticket system',
        'Satisfaction scoring',
      ],
      buildTime: 12,
      distributionChannels: ['Customer Support forums', 'ProductHunt', 'Twitter'],
      geoTopics: [
        'best customer support tools',
        'fast customer support',
        'support response time',
        'improve customer service',
      ],
    };
  }

  /**
   * Generate generic MVP
   */
  private generateGenericMVP(gap: MarketGap): MVP {
    return {
      productName: gap.opportunityName.replace(/\s+/g, ''),
      targetUser: 'Users with this problem',
      coreFeature: gap.marketGap,
      pricing: 19,
      mvpScope: [
        'Core feature implementation',
        'Basic user interface',
        'User feedback system',
      ],
      buildTime: 14,
      distributionChannels: ['Twitter/X', 'Reddit', 'ProductHunt'],
      geoTopics: [
        `solve ${gap.complaint}`,
        `fix ${gap.complaint}`,
        `alternative for ${gap.complaint}`,
      ],
    };
  }

  /**
   * Generate bad ideas (me-too products)
   */
  generateBadIdeaExamples(): Array<{ product: string; reason: string }> {
    return [
      {
        product: 'AI Cold Email Generator',
        reason: 'Too much competition, free alternatives like ChatGPT, feature homogenization',
      },
      {
        product: 'AI LinkedIn Outreach Tool',
        reason: 'LinkedIn cracking down on automation, users afraid of bans, too many competitors',
      },
      {
        product: 'Generic AI Content Generator',
        reason: 'Too many people doing it, low technical barrier, hard to stand out',
      },
    ];
  }

  /**
   * Generate good ideas (niche angles)
   */
  generateGoodIdeaExamples(): Array<{ product: string; reason: string }> {
    return [
      {
        product: 'LinkedIn Reply Optimizer',
        reason: 'Focused on reply rates, less competition, result-oriented users, easier to sell',
      },
      {
        product: 'Context-Aware Outreach Tool',
        reason: 'Solves user complaints about templated content, clear differentiation',
      },
      {
        product: 'Anti-Detection Browser Profile Manager',
        reason: 'High demand, strong user pain points, users willing to pay to avoid bans',
      },
    ];
  }
}
