// 快速测试AI连接
import { fileURLToPath } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { askJSON } from "./packages/ai-core/src/index.ts";

console.log("=== 测试AI连接 ===\n");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
console.log("OPENAI_BASE_URL:", process.env.OPENAI_BASE_URL);
console.log("OPENAI_MODEL:", process.env.OPENAI_MODEL);
console.log("");

try {
  console.log("正在连接Gemini API...");
  const result = await askJSON({
    system: "你是一个有用的助手，只返回JSON格式：{\"status\":\"ok\",\"message\":\"AI连接成功\"}",
    user: "返回一个简单的确认消息",
  });
  console.log("✅ AI连接成功！");
  console.log("结果:", result.data);
  console.log("费用: $" + result.usage.cost_usd.toFixed(6));
  process.exit(0);
} catch (e) {
  console.error("❌ AI连接失败:", e.message);
  console.log("\n需要配置有效的API Key！");
  console.log("请到 https://aistudio.google.com/app/apikey 获取免费的Gemini API Key");
  process.exit(1);
}
