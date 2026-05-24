#!/usr/bin/env node

const key = "e44cdff52aa67110946cf9edf3de4a0356c3338431b4e3fe12cc4ac1d60cf9c0";

console.log("\n" + "=".repeat(60));
console.log("🔍 测试 Google Trends 数据源");
console.log("=".repeat(60) + "\n");

try {
  const url = `https://serpapi.com/search.json?engine=google_trends&q=AI+tool&data_type=RELATED_QUERIES&date=now+7-d&api_key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.log(`❌ 失败: HTTP ${res.status}`);
    console.log("响应:", text);
    process.exit(1);
  }

  const data = await res.json();
  const rising = data?.related_queries?.rising || [];

  console.log(`✅ 成功！获取 ${rising.length} 条 rising queries\n`);
  console.log("🔥 热门趋势：\n");

  rising.slice(0, 10).forEach((r, i) => {
    const query = r.query ?? "";
    const value = r.extracted_value ?? 0;
    const label = value === 8900 ? "🚀 Breakout" : `+${value}%`;
    console.log(`  ${i + 1}. ${query} ${label}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Google Trends 数据源正常工作！");
  console.log("=".repeat(60) + "\n");

} catch (e) {
  console.error("❌ 错误:", e.message);
  process.exit(1);
}
