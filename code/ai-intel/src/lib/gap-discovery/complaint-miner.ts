/**
 * Complaint Mining Engine
 *
 * 目标：自动收集负面反馈
 *
 * 来源：
 * - Reddit
 * - IndieHackers
 * - G2
 * - Trustpilot
 * - Capterra
 * - AppSumo
 * - Product Hunt 评论
 * - GitHub Issues
 * - X
 *
 * 不要问：用户需要什么
 * 要问：用户讨厌什么，用户抱怨什么，用户取消订阅什么，用户退款什么，用户吐槽什么
 */

import { Complaint, EvidenceGrade, Frequency, Severity } from './types';

/**
 * Common Complaint Patterns - 预定义的常见抱怨模式
 */
export const COMMON_COMPLAINT_PATTERNS = [
  '价格太贵',
  '太复杂',
  '太模板化',
  '容易被检测',
  '账号被封',
  '回复率太低',
  '打开率低',
  '效果差',
  '数据不准',
  '速度太慢',
  '数据不安全',
  '价格变动',
  '难以使用',
  '支持太差',
  '更新慢',
  '容易崩溃',
  '不稳定',
  '垃圾邮件',
  '垃圾内容',
  '广告太多',
  'UI太垃圾',
  '无法满足要求',
  '功能缺失',
  '功能不完整',
  'bug太多',
  '无法使用',
  '无法登录',
  '无法导出数据',
  '数据丢失',
  '隐私问题',
  '定价不合理',
  '订阅无法取消',
  '自动续费',
  '退款难',
  '客服不回应',
  '操作繁琐',
  '界面丑陋',
  '加载慢',
  '经常卡',
  '不准确',
  '功能重复',
  '容易疲劳',
  '内容重复',
  '无法集成',
  'API不稳定',
  '文档差',
  '学习曲线陡',
  '设置复杂',
  '配置困难',
  '容易出错',
  '体验差',
  '产品质量差',
  '功能太弱',
  '不如竞品',
  '竞品更好',
  '不更新了',
  '停止维护',
  '已废弃',
  '没人维护',
  '更新慢',
  '不改进',
  '功能退步',
  '功能倒退',
  '体验下降',
  '越来越差',
  '质量下降',
  '内容越来越垃圾',
  '客服越来越垃圾',
  '客服差',
  '支持不力',
  '不解决问题',
  '回应慢',
  '不回消息',
  '无法联系',
  '客服不理人',
  '客服没礼貌',
  '客服态度差',
  '客服无法解决问题',
  '响应慢',
  '客服太不专业',
  '客服知识不足',
  '客服无法理解问题',
  '客服推诿',
  '客服踢皮球',
  '客服推卸责任',
  '客服态度恶劣',
  '客服敷衍',
  '客服不专业',
  '客服不负责',
  '客服态度不好',
  '客服服务差',
  '客服很垃圾',
  '客服态度恶劣',
  '客服差劲',
  '客服太糟糕',
  '别买',
  '退款',
  '踩坑',
  '避雷',
  '别用',
  '没用',
  '后悔买了',
  '后悔用了',
  '浪费钱',
  '浪费时间',
  '完全没用',
  '没用的工具',
  '没用的产品',
  '没用的软件',
  '没用的服务',
  '没用的网站',
  '没用的应用',
  '没用的APP',
  '完全不行',
  '彻底没用',
  '根本没用',
  '真没用',
  '真垃圾',
  '真的垃圾',
  '太垃圾了',
  '这垃圾',
  '垃圾东西',
  '垃圾产品',
  '垃圾软件',
  '垃圾服务',
  '垃圾工具',
  '垃圾网站',
  '垃圾应用',
  '垃圾APP',
  '产品烂透了',
  '超级烂',
  '非常烂',
  '烂到不行',
  '烂透了',
  '烂的要死',
  '烂得要死',
  '烂得不行',
  '烂透顶',
  '烂到爆炸',
  '烂得爆炸',
  '烂到极点',
  '烂到极致',
  '烂到爆',
  '烂到炸',
  '烂到爆了',
  '烂炸了',
];

/**
 * Complaint Mining Engine
 */
export class ComplaintMiner {
  /**
   * Mine complaints from various sources
   */
  async mineComplaints(
    topic: string,
    sources: string[] = ['reddit', 'indiehackers', 'producthunt']
  ): Promise<Complaint[]> {
    const complaints: Complaint[] = [];

    console.log(`[ComplaintMiner] Mining complaints for: ${topic}`);

    // For each source, try to find complaints
    for (const source of sources) {
      try {
        const sourceComplaints = await this.mineFromSource(topic, source);
        complaints.push(...sourceComplaints);
      } catch (error) {
        console.error(`[ComplaintMiner] Failed to mine from ${source}:`, error);
      }
    }

    // Aggregate and deduplicate
    const aggregated = this.aggregateComplaints(complaints);

    console.log(`[ComplaintMiner] Found ${aggregated.length} complaints`);

    return aggregated;
  }

  /**
   * Mine complaints from a specific source
   */
  private async mineFromSource(topic: string, source: string): Promise<Complaint[]> {
    // In a real implementation, this would fetch real data from APIs
    // For now, we'll return placeholder data
    
    console.log(`[ComplaintMiner] Mining from ${source}...`);
    
    // Placeholder - in reality, we'd fetch from actual APIs
    return [];
  }

  /**
   * Aggregate complaints - group similar ones
   */
  private aggregateComplaints(complaints: Complaint[]): Complaint[] {
    // Simple aggregation - in reality, we'd use more sophisticated NLP
    const complaintMap = new Map<string, Complaint>();

    for (const complaint of complaints) {
      const key = complaint.complaint.toLowerCase();
      
      if (complaintMap.has(key)) {
        const existing = complaintMap.get(key)!;
        existing.evidenceCount += complaint.evidenceCount;
        existing.evidenceUrls.push(...complaint.evidenceUrls);
        existing.exampleQuotes.push(...complaint.exampleQuotes);
      } else {
        complaintMap.set(key, { ...complaint });
      }
    }

    return Array.from(complaintMap.values()).sort((a, b) => b.evidenceCount - a.evidenceCount);
  }

  /**
   * Determine frequency from evidence count
   */
  private getFrequency(evidenceCount: number): Frequency {
    if (evidenceCount >= 50) return Frequency.VeryHigh;
    if (evidenceCount >= 20) return Frequency.High;
    if (evidenceCount >= 10) return Frequency.Medium;
    if (evidenceCount >= 3) return Frequency.Low;
    return Frequency.VeryLow;
  }

  /**
   * Determine severity from content
   */
  private getSeverity(complaint: string): Severity {
    const highSeverityKeywords = ['封', '退款', '垃圾', '烂', '没用', '后悔', '踩坑', '避雷'];
    const mediumSeverityKeywords = ['差', '慢', '复杂', 'bug', '崩溃', '贵', '讨厌'];

    for (const keyword of highSeverityKeywords) {
      if (complaint.includes(keyword)) {
        return Severity.High;
      }
    }

    for (const keyword of mediumSeverityKeywords) {
      if (complaint.includes(keyword)) {
        return Severity.Medium;
      }
    }

    return Severity.Low;
  }
}
