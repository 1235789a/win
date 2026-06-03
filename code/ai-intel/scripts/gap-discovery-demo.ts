#!/usr/bin/env ts-node
/**
 * Gap Discovery Engine - Demo
 *
 * Proof Mode: Using manual evidence (from web search) to verify an opportunity
 *
 * Opportunity: ReachIQ - LinkedIn Cold Email Generator
 */

import 'dotenv/config';
import {
  GapDiscoveryPipeline,
  Complaint,
  Competitor,
  RevenueSignal,
  EvidenceGrade,
  Frequency,
  Severity,
  RevenueStrength,
} from '../src/lib/gap-discovery';

async function main() {
  console.log('='.repeat(80));
  console.log('GAP DISCOVERY ENGINE - PROOF MODE');
  console.log('='.repeat(80));
  console.log('\n');

  // Manual evidence from web search
  const opportunity = 'ReachIQ - LinkedIn Cold Email Generator';

  const whoPays = ['B2B Sales Teams', 'SDRs', 'Indie Hackers/Solopreneurs', 'Recruiters', 'Agencies'];

  const whyTheyPay = [
    'Automate cold outreach to save time',
    'Scale outreach beyond manual limits',
    'Personalize at scale',
    'Get more leads and meetings',
  ];

  // Pain evidence (5+)
  const complaints: Complaint[] = [
    {
      complaint: 'AI content is too templated',
      frequency: Frequency.VeryHigh,
      evidenceCount: 5,
      evidenceUrls: [
        'https://ricochetb2b.com/blog/ai-lead-gen-tool-failed-what-we-learned',
        'https://origami.chat/blog/ai-frustration-linkedin-prospecting-fix',
        'https://connectsafely.ai/articles/linkedin-message-templates-inbound-authority-2026',
      ],
      exampleQuotes: [
        "Even 'personalized' AI messages often pull the same variable fields - company, job title, mutual connections - and stitch them into a sentence that anyone can spot. Buyers have grown numb to this pattern.",
        "Template fatigue is real: prospects receive 20-40 cold messages monthly and recognize templates instantly, per LinkedIn data. Cold template response rates have collapsed: from 15-20% in 2020 to 5-10% in 2026.",
      ],
      severity: Severity.High,
      grade: EvidenceGrade.S,
    },
    {
      complaint: 'LinkedIn accounts getting banned',
      frequency: Frequency.High,
      evidenceCount: 4,
      evidenceUrls: [
        'https://www.linkedhelper.com/blog/linkedin-cold-messages/',
      ],
      exampleQuotes: [
        "LinkedIn now uses AI to identify mass templating: message similarity analysis, timing pattern detection, response rate monitoring.",
        "The Enterprise Sales Navigator API starts at £8,000 per year. Our SMB clients just don't have the budget for that.",
      ],
      severity: Severity.Critical,
      grade: EvidenceGrade.S,
    },
    {
      complaint: 'Reply rates are too low',
      frequency: Frequency.High,
      evidenceCount: 5,
      evidenceUrls: [
        'https://www.indiehackers.com/post/my-cold-outreach-went-from-2-to-18-reply-rate-heres-the-exact-framework-i-m-using-now-a53ecc486b',
      ],
      exampleQuotes: [
        "For the first 6 weeks, it was brutal. Out of ~200 cold messages across LinkedIn and Reddit, I got 4 replies. Two of those were 'not interested.'",
        "Classic openers like 'Hope this finds you well' or 'I saw your profile and thought we should connect' are instant delete triggers.",
      ],
      severity: Severity.High,
      grade: EvidenceGrade.S,
    },
    {
      complaint: 'Too expensive',
      frequency: Frequency.Medium,
      evidenceCount: 3,
      evidenceUrls: [],
      exampleQuotes: ["The Enterprise Sales Navigator API starts at £8,000 per year. Our SMB clients just don't have the budget for that."],
      severity: Severity.Medium,
      grade: EvidenceGrade.S,
    },
    {
      complaint: 'Content quality is bad',
      frequency: Frequency.High,
      evidenceCount: 3,
      evidenceUrls: [],
      exampleQuotes: [],
      severity: Severity.High,
      grade: EvidenceGrade.B,
    },
  ];

  // Competitor evidence (5+)
  const competitors: Competitor[] = [
    {
      name: 'SalesRobot',
      monthlyPrice: 59,
      oneTimePrice: null,
      freeTrial: false,
      positioning: 'LinkedIn automation + email',
      evidenceUrl: 'https://www.salesrobot.co/blogs/top-10-cold-email-automation-tool',
    },
    {
      name: 'Saleshandy',
      monthlyPrice: 36,
      oneTimePrice: null,
      freeTrial: false,
      positioning: 'Cold email automation',
      evidenceUrl: 'https://www.salesrobot.co/blogs/top-10-cold-email-automation-tool',
    },
    {
      name: 'Woodpecker',
      monthlyPrice: 29,
      oneTimePrice: null,
      freeTrial: false,
      positioning: 'B2B outreach, simple UI',
      evidenceUrl: 'https://www.salesrobot.co/blogs/top-10-cold-email-automation-tool',
    },
    {
      name: 'Smartlead.ai',
      monthlyPrice: 32.5,
      oneTimePrice: null,
      freeTrial: false,
      positioning: 'Email-only automation',
      evidenceUrl: 'https://www.salesrobot.co/blogs/top-10-cold-email-automation-tool',
    },
    {
      name: 'Instantly.ai',
      monthlyPrice: 37,
      oneTimePrice: null,
      freeTrial: false,
      positioning: 'Email-only automation',
      evidenceUrl: 'https://www.salesrobot.co/blogs/top-10-cold-email-automation-tool',
    },
  ];

  // Revenue signal
  const revenueSignal: RevenueSignal = {
    strength: RevenueStrength.Strong,
    hasPaidPlans: true,
    hasPriceIncreases: false,
    hasEnterprisePlans: true,
    hasRenewals: true,
    hasLongTermOperation: true,
    evidenceUrls: [],
  };

  // Run pipeline
  const pipeline = new GapDiscoveryPipeline();
  const report = await pipeline.runWithManualEvidence(
    opportunity,
    whoPays,
    whyTheyPay,
    complaints,
    competitors,
    revenueSignal
  );

  // Print report
  pipeline.printReport(report);
}

main().catch(console.error);
