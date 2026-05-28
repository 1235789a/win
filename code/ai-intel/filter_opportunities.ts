#!/usr/bin/env tsx

import Database from "better-sqlite3";
import fs from "node:fs";

// 定义需要排除的太普遍的类型
const COMMON_KEYWORDS = [
  "voice", "speech", "audio", "sound", // 语音、音频
  "video", "youtube", "subtitle", // 视频、字幕
  "pdf", "document", // PDF、文档
  "tts", "text-to-speech", // 文本转语音
  "whatsapp", "telegram", "slack", // 通讯工具
  "crm", "sales", "marketing", // CRM、销售、营销
  "llm", "chatbot", "chatgpt", // 通用LLM、聊天机器人
  "screen recording", "recording", "screenshot", // 录屏、截图
  "pdf parse", "pdf extract", // PDF解析
  "voice call", "phone", "telephone", // 电话、语音通话
  "video generation", "video edit", // 视频生成、编辑
];

const UNIQUE_KEYWORDS = [
  "finance", "trading", "investment", // 金融
  "healthcare", "medical", "doctor", // 医疗健康
  "legal", "lawyer", "contract", // 法律
  "construction", "engineering", // 建筑、工程
  "agriculture", "farming", // 农业
  "manufacturing", "factory", // 制造、工厂
  "real estate", "property", // 房地产
  "travel", "hospitality", "hotel", // 旅游、酒店
  "gaming", "game development", // 游戏
  "education", "learning", "student", // 教育
  "physical product", "hardware", // 实体产品、硬件
  "local", "geospatial", "mapping", // 本地、地理空间
  "real-time", "IoT", "sensor", // 实时、物联网、传感器
  "offline", "no internet", // 离线
  "privacy", "security", "encryption", // 隐私、安全、加密
  "open source", "self-hosted", // 开源、自托管
  "niche", "specific industry", // 细分、特定行业
];

function containsAny(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

async function main() {
  const db = new Database("./data/intel.db");

  // 查询所有P0机会
  const opportunities = db
    .prepare("SELECT * FROM opportunities WHERE priority = 'P0' ORDER BY score DESC")
    .all() as any[];

  console.log(`\n=== 总共 ${opportunities.length} 个P0机会 ===\n`);

  // 筛选掉太普遍的项目
  const uniqueOpportunities = opportunities.filter(opp => {
    const title = opp.title || "";
    const niche = opp.target_niche || "";
    const tags = opp.tags || "";
    const pain = opp.pain_point_analysis || "";

    // 如果包含太普遍的关键词，排除
    if (containsAny(title + niche + tags + pain, COMMON_KEYWORDS)) {
      return false;
    }

    // 如果包含独特的关键词，保留
    return true;
  });

  console.log(`\n=== 筛选后 ${uniqueOpportunities.length} 个更有特色的P0机会 ===\n`);

  // 输出筛选后的结果
  const outputData = uniqueOpportunities.map((opp, idx) => ({
    id: opp.id,
    title: opp.title,
    score: opp.score,
    target_niche: opp.target_niche,
    tags: opp.tags,
    source_url: opp.source_url,
    source_platform: opp.source_platform,
  }));

  // 保存到文件
  const outputJson = JSON.stringify(outputData, null, 2);
  fs.writeFileSync("./filtered_opportunities.json", outputJson, "utf8");
  console.log(`✓ 已保存到 ./filtered_opportunities.json`);

  // 打印前15个最有特色的
  console.log(`\n=== 筛选后的TOP 15个P0机会 ===\n`);

  uniqueOpportunities.slice(0, 15).forEach((opp, idx) => {
    console.log(`${idx + 1}. [${opp.score}分] ${opp.title}`);
    console.log(`   目标用户: ${opp.target_niche}`);
    console.log(`   标签: ${opp.tags}`);
    console.log(`   链接: ${opp.source_url}`);
    console.log(``);
  });

  // 再按独特性标签分类
  console.log(`\n=== 按特色分类的P0机会 ===\n`);

  UNIQUE_KEYWORDS.forEach(category => {
    const categoryOpportunities = uniqueOpportunities.filter(opp => {
      const text = (opp.title + opp.target_niche + opp.tags).toLowerCase();
      return text.includes(category.toLowerCase());
    });

    if (categoryOpportunities.length > 0) {
      console.log(`\n【${category}】(${categoryOpportunities.length}个)`);
      categoryOpportunities.slice(0, 5).forEach(opp => {
        console.log(`   - [${opp.score}] ${opp.title}`);
      });
    }
  });

  console.log(`\n✓ 完成！查看 ./filtered_opportunities.json 获取完整列表`);
  db.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
