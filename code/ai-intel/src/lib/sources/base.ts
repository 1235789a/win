// SourceAdapter 统一接口：所有数据源都要实现这个
// 设计目标：harvester 不关心具体平台，只管 harvest() → RawItem[]

export interface RawItem {
  /** 平台标识 */
  platform: string;
  /** 唯一标识（用于去重） */
  id: string;
  /** 原始文本内容（帖子标题 + 正文 / 评论摘要） */
  text: string;
  /** 原始 URL */
  url: string;
  /** 发布时间 ISO */
  published_at?: string;
  /** 互动量（upvotes / comments / engagement） */
  engagement?: number;
  /** 额外元数据 */
  meta?: Record<string, unknown>;
}

export interface HarvestOptions {
  /** 最大返回条数 */
  limit?: number;
  /** 关键词过滤（部分源支持） */
  keywords?: string[];
  /** 最近多少小时的内容 */
  maxAgeHours?: number;
}

export interface SourceAdapter {
  /** 平台名（对应 SourcePlatform 类型） */
  name: string;
  /** 抓取一批最新内容 */
  harvest(opts?: HarvestOptions): Promise<RawItem[]>;
}
