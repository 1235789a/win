#!/usr/bin/env node
/**
 * 测试数据源 7-11: V2EX, IndieHackers, BlackHatWorld, Nitter, Google Trends
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

console.log("\n" + "=".repeat(70));
console.log("🔍 测试数据源 7-11");
console.log("=".repeat(70) + "\n");

// V2EX
async function testV2EX() {
  console.log("📌 7. V2EX (中文技术社区)");
  console.log("   URL: https://www.v2ex.com/api/topics/hot.json");
  try {
    const res = await fetch("https://www.v2ex.com/api/topics/hot.json", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`   ✅ 成功！获取 ${data.length} 条数据`);
      if (data.length > 0) {
        console.log(`   示例: "${data[0].title?.slice(0, 60)}"`);
      }
      return data.length;
    } else {
      console.log(`   ❌ 失败: HTTP ${res.status}`);
      return 0;
    }
  } catch (e) {
    console.log(`   ❌ 错误: ${e.message}`);
    return 0;
  }
}

// IndieHackers
async function testIndieHackers() {
  console.log("\n📌 8. IndieHackers (独立开发者社区)");
  console.log("   URL: https://www.indiehackers.com/feed?type=popular");
  try {
    const res = await fetch("https://www.indiehackers.com/feed?type=popular", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Accept": "text/html"
      }
    });
    if (res.ok) {
      const html = await res.text();
      const hasNextData = html.includes("__NEXT_DATA__");
      console.log(`   响应长度: ${html.length}`);
      console.log(`   包含 __NEXT_DATA__: ${hasNextData ? "是" : "否"}`);
      if (hasNextData) {
        const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (match) {
          const data = JSON.parse(match[1]);
          const posts = data?.props?.pageProps?.posts || data?.props?.pageProps?.feed || [];
          console.log(`   ✅ 解析成功！获取 ${posts.length} 条数据`);
          if (posts.length > 0) {
            console.log(`   示例: "${posts[0]?.title?.slice(0, 60)}"`);
          }
          return posts.length;
        }
      }
      console.log(`   ⚠️ 无法解析Next.js数据`);
      return 0;
    } else {
      console.log(`   ❌ 失败: HTTP ${res.status}`);
      return 0;
    }
  } catch (e) {
    console.log(`   ❌ 错误: ${e.message}`);
    return 0;
  }
}

// BlackHatWorld
async function testBlackHatWorld() {
  console.log("\n📌 9. BlackHatWorld (黑帽SEO/自动化社区)");
  console.log("   RSS源: https://www.blackhatworld.com/forums/black-hat-seo.2/index.rss");
  try {
    const res = await fetch("https://www.blackhatworld.com/forums/black-hat-seo.2/index.rss", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (res.ok) {
      const xml = await res.text();
      const items = xml.split("<item>").slice(1, 6);
      console.log(`   ✅ 成功！获取 ${items.length} 条数据`);
      if (items.length > 0) {
        const titleMatch = items[0].match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ||
                           items[0].match(/<title>([\s\S]*?)<\/title>/)?.[1];
        if (titleMatch) {
          console.log(`   示例: "${titleMatch.trim().slice(0, 60)}"`);
        }
      }
      return items.length;
    } else {
      console.log(`   ❌ 失败: HTTP ${res.status}`);
      return 0;
    }
  } catch (e) {
    console.log(`   ❌ 错误: ${e.message}`);
    return 0;
  }
}

// Nitter
async function testNitter() {
  console.log("\n📌 10. Nitter (Twitter替代)");
  console.log("   尝试多个镜像...");
  const instances = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.cz",
    "https://nitter.net"
  ];

  for (const inst of instances) {
    try {
      const res = await fetch(`${inst}/search/rss?f=tweets&q=automation`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const xml = await res.text();
        const items = xml.split("<item>").slice(1, 4);
        console.log(`   ✅ ${inst} 可用！获取 ${items.length} 条数据`);
        if (items.length > 0) {
          const titleMatch = items[0].match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ||
                             items[0].match(/<title>([\s\S]*?)<\/title>/)?.[1];
          if (titleMatch) {
            console.log(`   示例: "${titleMatch.trim().slice(0, 60)}"`);
          }
        }
        return items.length;
      } else {
        console.log(`   ⚠️ ${inst}: HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`   ⚠️ ${inst}: ${e.message}`);
    }
  }
  console.log(`   ❌ 所有镜像都不可用`);
  return 0;
}

// Google Trends
async function testGoogleTrends() {
  console.log("\n📌 11. Google Trends (搜索趋势)");
  console.log("   ⚠️ 需要 SERPAPI_KEY 环境变量");
  const key = process.env.SERPAPI_KEY || "";
  if (!key) {
    console.log("   ❌ SERPAPI_KEY 未设置，跳过测试");
    console.log("   💡 获取方式: https://serpapi.com/");
    return 0;
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_trends&q=AI+tool&data_type=RELATED_QUERIES&date=now+7-d&api_key=${key}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const rising = data?.related_queries?.rising || [];
      console.log(`   ✅ API可用！获取 ${rising.length} 条rising queries`);
      if (rising.length > 0) {
        console.log(`   示例: "${rising[0]?.query}" (+${rising[0]?.extracted_value}%)`);
      }
      return rising.length;
    } else {
      console.log(`   ❌ API失败: HTTP ${res.status}`);
      return 0;
    }
  } catch (e) {
    console.log(`   ❌ 错误: ${e.message}`);
    return 0;
  }
}

// 运行测试
async function main() {
  const results = [];

  console.log("开始测试...\n");

  const v2ex = await testV2EX();
  results.push({ name: "V2EX", count: v2ex });

  const ih = await testIndieHackers();
  results.push({ name: "IndieHackers", count: ih });

  const bhw = await testBlackHatWorld();
  results.push({ name: "BlackHatWorld", count: bhw });

  const nitter = await testNitter();
  results.push({ name: "Nitter", count: nitter });

  const trends = await testGoogleTrends();
  results.push({ name: "Google Trends", count: trends });

  console.log("\n" + "=".repeat(70));
  console.log("📊 测试结果汇总");
  console.log("=".repeat(70));

  results.forEach(r => {
    const icon = r.count > 0 ? "✅" : "❌";
    console.log(`  ${icon} ${r.name.padEnd(20)} ${r.count > 0 ? r.count + " 条" : "不可用"}`);
  });

  const totalWorking = results.filter(r => r.count > 0).length;
  console.log(`\n总计: ${totalWorking}/5 个数据源可用`);

  console.log("\n💡 建议:");
  if (totalWorking === 5) {
    console.log("  🎉 所有数据源都可用！可以开启全部源采集");
  } else {
    console.log("  📝 未通过测试的源可能需要:");
    console.log("     - 检查网络连接");
    console.log("     - 等待服务恢复");
    console.log("     - 配置必要的API Key");
  }
}

main();
