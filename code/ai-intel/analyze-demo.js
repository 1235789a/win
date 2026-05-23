#!/usr/bin/env node
/**
 * AI分析演示脚本
 *
 * 这个脚本展示系统如何对采集到的数据进行AI分析
 * 需要配置有效的API Key才能运行真实分析
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

console.log("\n" + "=".repeat(60));
console.log("🚀 AI 创业机会分析系统");
console.log("=".repeat(60) + "\n");

console.log("📋 配置检查:");
console.log("  AI Provider:", process.env.AI_PROVIDER || "未设置");
console.log("  Model:", process.env.OPENAI_MODEL || "gemini-2.0-flash-lite");
console.log("");

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-gemini-api-key-here") {
  console.log("❌ 尚未配置API Key！\n");
  console.log("请按以下步骤配置:");
  console.log("  1. 访问 https://aistudio.google.com/app/apikey");
  console.log("  2. 创建免费的API Key");
  console.log("  3. 编辑 .env.local 文件，替换 OPENAI_API_KEY 的值");
  console.log("  4. 重新运行此脚本\n");

  console.log("💡 免费额度说明:");
  console.log("  - Gemini 2.0 Flash Lite: 每月免费使用量大，足够个人使用");
  console.log("  - 无需信用卡，直接获取API Key");
  console.log("");

  // 展示一个模拟的分析结果演示
  console.log("\n" + "=".repeat(60));
  console.log("📊 演示模式: 展示系统工作流程");
  console.log("=".repeat(60) + "\n");

  console.log("步骤1️⃣: 数据采集");
  console.log("  ✅ HackerNews: 10条帖子");
  console.log("  ✅ ProductHunt: 50个产品");
  console.log("  ✅ Dev.to: 10篇文章");
  console.log("  ✅ GitHub Trending: 5个项目");
  console.log("  ✅ Upwork: 20个职位");
  console.log("");

  console.log("步骤2️⃣: AI智能分析 (两步管线)");
  console.log("  Phase A: 评分阶段 - 评估每个机会的商业价值");
  console.log("  Phase B: Blueprint生成 - 为高分机会生成详细方案");
  console.log("");

  console.log("步骤3️⃣: 机会评分标准");
  console.log("  📊 评分维度:");
  console.log("     - 痛点强度 (1-25分)");
  console.log("     - Build Once, Sell Infinite (1-25分)");
  console.log("     - 市场时机 (1-25分)");
  console.log("     - 差异化 (1-25分)");
  console.log("");

  console.log("步骤4️⃣: Blueprint生成 (仅对≥80分的机会)");
  console.log("  📝 Blueprint内容:");
  console.log("     - 产品名称 & 标语");
  console.log("     - 目标细分市场");
  console.log("     - 核心痛点");
  console.log("     - 解决方案架构");
  console.log("     - MVP功能列表");
  console.log("     - 定价策略");
  console.log("     - 冷启动方案");
  console.log("");

  console.log("步骤5️⃣: 聚类分析");
  console.log("  🔗 将相似的创业机会归类");
  console.log("  📈 识别跨平台的热门趋势");
  console.log("");

  console.log("=" .repeat(60));
  console.log("✅ 演示完成！");
  console.log("=" .repeat(60) + "\n");

  console.log("📚 想要运行真实分析？");
  console.log("   1. 获取免费的 Gemini API Key");
  console.log("   2. 编辑 .env.local 设置 OPENAI_API_KEY");
  console.log("   3. 运行: npm run harvester\n");

  console.log("📂 相关文件:");
  console.log("   - 数据源: src/lib/sources/");
  console.log("   - AI分析: src/lib/two-step-analyze.ts");
  console.log("   - 采集脚本: scripts/harvester_v2.ts");
  console.log("");

} else {
  console.log("✅ API Key已配置！");
  console.log("正在测试连接...\n");

  try {
    const { askJSON } = await import("./packages/ai-core/src/index.ts");

    const result = await askJSON({
      system: `你是一个创业机会分析助手。对每个机会，你需要返回一个JSON对象：
      {
        "score": 0-100的评分,
        "title": "产品名称",
        "pain_point": "核心痛点",
        "solution": "解决方案",
        "why_now": "为什么现在是最佳时机",
        "mvp_features": ["功能1", "功能2", ...],
        "pricing": "定价策略建议",
        "cold_start": "冷启动策略"
      }`,
      user: `分析这个创业机会：Dev.to上的一篇文章标题是
      "I Built a Fully Automated YouTube Channel That Uploads Every Day - Without Touching It"

      请分析这是否是一个好的SaaS创业机会，考虑：
      1. 目标用户是谁
      2. 痛点有多痛
      3. 是否有"Build Once, Sell Infinite"特性
      4. 市场有多大
      5. 竞争情况如何

      只返回一个JSON对象，不要其他文字。`,
    });

    console.log("\n🎉 AI分析成功！\n");
    console.log("📊 分析结果:");
    console.log(JSON.stringify(result.data, null, 2));
    console.log("\n💰 本次API费用: $" + result.usage.cost_usd.toFixed(6));

  } catch (e) {
    console.error("\n❌ AI分析失败:", e.message);
  }
}
