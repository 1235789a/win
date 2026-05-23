#!/usr/bin/env node
/**
 * AI分析演示脚本
 * 基于5次批量采集的真实数据进行AI分析流程演示
 */

console.log("\n" + "=".repeat(60));
console.log("🚀 AI 创业机会分析系统 - 工作流程演示");
console.log("=".repeat(60) + "\n");

console.log("📋 配置检查:");
console.log("  AI Provider:", process.env.AI_PROVIDER || "未设置");
console.log("  Model:", process.env.OPENAI_MODEL || "gemini-2.0-flash-lite");
console.log("  API Key:", process.env.OPENAI_API_KEY ?
  (process.env.OPENAI_API_KEY.slice(0, 10) + "...") : "❌ 未设置");
console.log("");

console.log("=" .repeat(60));
console.log("📊 基于真实采集数据的AI分析结果");
console.log("=" .repeat(60) + "\n");

// 展示真实的采集数据
const demoData = [
  {
    source: "Dev.to",
    title: "I Built a Fully Automated YouTube Channel That Uploads Every Day",
    url: "https://dev.to/0shuvo0/i-built-a-fully-automated-youtube-channel-that-uploads-every-day-without-touc",
    type: "article",
    engagement: "high"
  },
  {
    source: "HackerNews",
    title: "What spec-driven development gets wrong",
    url: "https://www.augmentcode.com/blog/what-spec-driven-development-gets-wrong",
    type: "discussion",
    engagement: "high"
  },
  {
    source: "ProductHunt",
    title: "Finderlock - AI-powered file organizer",
    type: "product_launch",
    engagement: "medium"
  },
  {
    source: "GitHub Trending",
    title: "colbymchenry/codegraph - AI代码分析",
    type: "open_source",
    engagement: "medium"
  },
  {
    source: "Upwork/Freelance",
    title: "Circle Medical Is Hiring Mobile Engineer",
    type: "job_posting",
    engagement: "high"
  }
];

console.log("✅ 基于5次批量采集的95条真实数据\n");

console.log("📝 步骤1: 数据采集 (已完成)");
console.log("  采集源: HackerNews, ProductHunt, Dev.to, GitHub Trending, Upwork");
console.log("  总数据: 95条/次 × 5次 = 475条数据");
console.log("");

console.log("🔍 步骤2: AI智能分析");
console.log("  系统使用两步AI分析管线:\n");

console.log("  Phase A: 快速评分 (所有数据)");
console.log("  ┌─────────────────────────────────────────────────┐");
console.log("  │ 输入: 原始文本                                   │");
console.log("  │  ↓                                               │");
console.log("  │ AI评分:                                          │");
console.log("  │   • 痛点强度 (1-25分)                           │");
console.log("  │   • Build Once, Sell Infinite (1-25分)           │");
console.log("  │   • 市场时机 (1-25分)                           │");
console.log("  │   • 差异化 (1-25分)                             │");
console.log("  │  ↓                                               │");
console.log("  │ 输出: 0-100评分 + 优先级标签                    │");
console.log("  └─────────────────────────────────────────────────┘\n");

console.log("  Phase B: Blueprint生成 (仅≥80分)");
console.log("  ┌─────────────────────────────────────────────────┐");
console.log("  │ 仅对高分机会生成完整Blueprint                   │");
console.log("  │                                                  │");
console.log("  │ Blueprint包含:                                    │");
console.log("  │   • 产品名称 & 标语                              │");
console.log("  │   • 目标细分市场                                  │");
console.log("  │   • 核心痛点 & 解决方案                          │");
console.log("  │   • 技术架构建议                                 │");
console.log("  │   • MVP功能列表                                  │");
console.log("  │   • 定价策略                                      │");
console.log("  │   • 冷启动方案 (7天计划)                         │");
console.log("  └─────────────────────────────────────────────────┘\n");

console.log("📊 步骤3: 分析真实数据样本\n");

demoData.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.source}] ${item.title}`);
  console.log(`     类型: ${item.type} | 热度: ${item.engagement}`);
  console.log("");
});

console.log("🎯 AI分析结果预测 (基于数据模式):\n");

// 为每个数据预测分析结果
const predictions = [
  {
    source: "Dev.to",
    title: "自动化YouTube频道",
    score: 88,
    priority: "P0",
    analysis: "强痛点：内容创作者需要持续输出但时间有限。解决方案明确：AI自动化创作+发布。符合Build Once, Sell Infinite原则。",
    blueprint: true
  },
  {
    source: "HackerNews",
    title: "spec-driven开发反思",
    score: 72,
    priority: "P1",
    analysis: "开发者效率方向。HN上讨论热烈，说明是真实痛点。但spec-driven开发市场可能较小众。",
    blueprint: false
  },
  {
    source: "ProductHunt",
    title: "AI文件管理器",
    score: 65,
    priority: "P2",
    analysis: "文件管理是红海市场。虽然有AI加持，但差异化难度大。用户需求存在但付费意愿待验证。",
    blueprint: false
  },
  {
    source: "GitHub",
    title: "代码图谱分析",
    score: 81,
    priority: "P0",
    analysis: "开发者工具方向，HN上高热度说明需求真实。代码分析和可视化工具有稳定需求。开源+付费模式可行。",
    blueprint: true
  },
  {
    source: "Upwork",
    title: "移动开发招聘",
    score: 45,
    priority: "P2",
    analysis: "这是招聘信号而非创业机会。不符合Build Once, Sell Infinite原则。",
    blueprint: false
  }
];

predictions.forEach(p => {
  const icon = p.priority === "P0" ? "🔥" : p.priority === "P1" ? "📈" : "  ";
  const bp = p.blueprint ? "📝 Blueprint" : "";
  console.log(`  ${icon} [${p.priority}] ${p.title} - 评分: ${p.score}/100 ${bp}`);
  console.log(`     ${p.analysis}\n`);
});

console.log("=" .repeat(60));
console.log("📈 统计预测:");
console.log("  P0机会: 2个 (40%)");
console.log("  P1机会: 1个 (20%)");
console.log("  P2机会: 2个 (40%)");
console.log("  Blueprint生成: 2个");
console.log("=" .repeat(60) + "\n");

console.log("💡 洞察:");
console.log("  • Dev.to的自动化内容创作方向最有潜力");
console.log("  • 开发者工具方向稳定且付费意愿高");
console.log("  • 避免纯招聘/Job Posting类数据");
console.log("");

console.log("✅ 要运行真实AI分析？");
console.log("   1. 获取API Key: https://aistudio.google.com/app/apikey");
console.log("   2. 编辑 .env.local");
console.log("   3. 运行: npx tsx scripts/harvester_v2.ts\n");
