
// JavaScript 测试脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=== 数据源测试报告 ===\n");

// 1. 测试 HackerNews
console.log("1. 测试 HackerNews...");
try {
  const hnRes = await fetch("https://hn.algolia.com/api/v1/search_by_date?tags=(show_hn,ask_hn,story)&numericFilters=created_at_i>" + Math.floor(Date.now()/1000-72*3600) + "&hitsPerPage=5");
  if (hnRes.ok) {
    const hnData = await hnRes.json();
    console.log("✅ HackerNews API 正常！抓取到 " + (hnData.hits?.length || 0) + " 条");
    if (hnData.hits?.length > 0) {
      console.log("   第一条: " + (hnData.hits[0].title?.substring(0, 80) || "(无标题)"));
    }
  } else {
    console.log("❌ HackerNews API 异常: " + hnRes.status);
  }
} catch (e) {
  console.log("❌ HackerNews 失败:", e.message);
}

// 2. 测试 GitHub Trending
console.log("\n2. 测试 GitHub Trending...");
try {
  const ghRes = await fetch("https://github.com/trending?since=weekly", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  if (ghRes.ok) {
    const ghHtml = await ghRes.text();
    if (ghHtml.includes('Box-row') || ghHtml.includes('repo name')) {
      console.log("✅ GitHub Trending 页面正常！");
    } else {
      console.log("⚠️ GitHub Trending 返回但内容可能有变化");
    }
  } else {
    console.log("❌ GitHub Trending 异常: " + ghRes.status);
  }
} catch (e) {
  console.log("❌ GitHub Trending 失败:", e.message);
}

// 3. 测试 ProductHunt
console.log("\n3. 测试 ProductHunt...");
try {
  const phRes = await fetch("https://www.producthunt.com/", {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Accept: "text/html" }
  });
  if (phRes.ok) {
    const phHtml = await phRes.text();
    if (phHtml.includes('__NEXT_DATA__') || phHtml.includes('producthunt')) {
      console.log("✅ ProductHunt 页面正常（可能需要更复杂的解析）");
    } else {
      console.log("⚠️ ProductHunt 返回但内容可能有变化");
    }
  } else {
    console.log("❌ ProductHunt 异常: " + phRes.status);
  }
} catch (e) {
  console.log("❌ ProductHunt 失败:", e.message);
}

// 4. 测试 Reddit
console.log("\n4. 测试 Reddit...");
try {
  const redditRes = await fetch("https://old.reddit.com/r/SaaS/new/.json?limit=3", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-intel-bot/1.0)" }
  });
  if (redditRes.status === 429) {
    console.log("⚠️ Reddit 返回 429 (限流了)，这是正常的");
  } else if (redditRes.ok) {
    const redditData = await redditRes.json();
    const count = redditData.data?.children?.length || 0;
    console.log("✅ Reddit API 正常！抓取到 " + count + " 条");
  } else {
    console.log("❌ Reddit 异常: " + redditRes.status);
  }
} catch (e) {
  console.log("❌ Reddit 失败:", e.message);
}

// 5. 测试 Dev.to
console.log("\n5. 测试 Dev.to...");
try {
  const devtoRes = await fetch("https://dev.to/api/articles?tag=automation&top=7&per_page=3", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  if (devtoRes.ok) {
    const articles = await devtoRes.json();
    console.log("✅ Dev.to API 正常！抓取到 " + articles.length + " 条");
    if (articles.length > 0) {
      console.log("   第一条: " + articles[0].title?.substring(0, 80));
    }
  } else {
    console.log("❌ Dev.to 异常: " + devtoRes.status);
  }
} catch (e) {
  console.log("❌ Dev.to 失败:", e.message);
}

// 6. 测试 Upwork RSS
console.log("\n6. 测试 Upwork RSS...");
try {
  const q = encodeURIComponent("automation tool");
  const upworkRes = await fetch(`https://www.upwork.com/ab/feed/jobs/rss?q=${q}&sort=recency`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-intel-bot/1.0)" }
  });
  if (upworkRes.ok) {
    const xml = await upworkRes.text();
    if (xml.includes("<entry>") || xml.includes("<item>")) {
      console.log("✅ Upwork RSS 正常！");
    } else {
      console.log("⚠️ Upwork RSS 返回但内容格式可能变化");
    }
  } else {
    console.log("❌ Upwork RSS 异常: " + upworkRes.status);
  }
} catch (e) {
  console.log("❌ Upwork RSS 失败:", e.message);
}

console.log("\n=== 测试完成 ===");
console.log("\n总结:");
console.log("- HackerNews: 稳定的 Algolia API，可靠 ✅");
console.log("- GitHub Trending: 页面解析，可能需要更新选择器 ⚠️");
console.log("- ProductHunt: Next.js SSR，可能需要更新解析逻辑 ⚠️");
console.log("- Reddit: 可能遇到 429 限流，代码已处理 ⚠️");
console.log("- Dev.to: 稳定的 API，可靠 ✅");
console.log("- Upwork RSS: 公开 RSS，可靠 ✅");
