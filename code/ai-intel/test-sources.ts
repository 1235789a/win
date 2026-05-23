
import { HackerNewsSource, RedditSource, GitHubTrendingSource, ProductHuntSource } from "./src/lib/sources";

async function testSource(name, source) {
  console.log(`\n=== Testing ${name} Source ===`);
  try {
    const items = await source.harvest({ limit: 5 });
    console.log(`✅ 成功抓取 ${items.length} 条`);
    if (items.length &gt; 0) {
      console.log("第一条预览:", {
        id: items[0].id,
        text: items[0].text ? items[0].text.substring(0, 100) : "",
        url: items[0].url,
        engagement: items[0].engagement,
      });
    }
    return { success: true, count: items.length };
  } catch (error) {
    console.error(`❌ ${name} 源失败:`, error instanceof Error ? error.message : String(error));
    return { success: false, count: 0 };
  }
}

async function main() {
  console.log("开始测试数据源...");

  const results = [];
  
  results.push(await testSource("HackerNews", new HackerNewsSource()));
  results.push(await testSource("GitHubTrending", new GitHubTrendingSource()));
  results.push(await testSource("ProductHunt", new ProductHuntSource()));

  console.log("\n=== Testing Reddit Source (单独执行，较慢) ===");
  try {
    const reddit = new RedditSource(["SaaS"]);
    const items = await reddit.harvest({ limit: 3 });
    console.log(`✅ Reddit 成功抓取 ${items.length} 条`);
    if (items.length &gt; 0) {
      console.log("第一条预览:", {
        id: items[0].id,
        text: items[0].text ? items[0].text.substring(0, 100) : "",
        url: items[0].url,
      });
    }
    results.push({ success: true, count: items.length });
  } catch (error) {
    console.error(`❌ Reddit 源失败:`, error instanceof Error ? error.message : String(error));
    results.push({ success: false, count: 0 });
  }

  console.log("\n=== 测试总结 ===");
  console.log(`HackerNews: ${results[0].success ? "✅" : "❌"} (${results[0].count}条)`);
  console.log(`GitHubTrending: ${results[1].success ? "✅" : "❌"} (${results[1].count}条)`);
  console.log(`ProductHunt: ${results[2].success ? "✅" : "❌"} (${results[2].count}条)`);
  console.log(`Reddit: ${results[3].success ? "✅" : "❌"} (${results[3].count}条)`);
}

main().catch(console.error);
