
// 批量测试数据源抓取
console.log("=== 批量数据源测试 (5次抓取) ===");
console.log(new Date().toLocaleString(), "\n");

function parseAtomXML(xml) {
  const entries = [];
  const entryBlocks = xml.split("<entry>").slice(1);
  for (const block of entryBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/);
    const link = linkMatch ? linkMatch[1] : "";
    entries.push({ title, link });
  }
  return entries;
}

function parseRSSXML(xml) {
  const entries = [];
  const itemBlocks = xml.split("<item>").slice(1);
  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "";
    let linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    if (!linkMatch) linkMatch = block.match(/<link[^>]*href="([^"]+)"/);
    const link = linkMatch ? linkMatch[1] : "";
    entries.push({ title, link });
  }
  return entries;
}

async function testHackerNews() {
  const res = await fetch("https://hn.algolia.com/api/v1/search_by_date?tags=(show_hn,ask_hn,story)&hitsPerPage=10");
  const data = await res.json();
  return (data.hits ?? []).map(h => ({
    title: h.title || "",
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`
  }));
}

async function testProductHunt() {
  const res = await fetch("https://www.producthunt.com/feed", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const xml = await res.text();
  return parseAtomXML(xml);
}

async function testDevTo() {
  const res = await fetch("https://dev.to/api/articles?tag=automation&top=7&per_page=10", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const data = await res.json();
  return data.map(p => ({ title: p.title, url: p.url }));
}

async function testGitHubTrending() {
  const res = await fetch("https://github.com/trending?since=weekly", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await res.text();
  const results = [];
  const parts = html.split('Box-row').slice(1, 6);
  for (const part of parts) {
    const nameMatch = part.match(/href="\/([^"]+)"/);
    if (nameMatch) {
      const name = nameMatch[1];
      results.push({
        title: name,
        url: `https://github.com/${name}`
      });
    }
  }
  return results;
}

async function testUpwork() {
  const res = await fetch("https://hnrss.org/jobs", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const xml = await res.text();
  return parseRSSXML(xml);
}

const sources = [
  { name: "HackerNews", fn: testHackerNews },
  { name: "ProductHunt", fn: testProductHunt },
  { name: "Dev.to", fn: testDevTo },
  { name: "GitHub Trending", fn: testGitHubTrending },
  { name: "Upwork/Freelance", fn: testUpwork }
];

const allResults = [];

for (let run = 0; run < 5; run++) {
  console.log(`\n===== 第 ${run + 1} 次抓取 =====`);
  const runResult = { run: run + 1, timestamp: new Date().toISOString(), sources: {} };

  for (const source of sources) {
    try {
      console.log(`  测试: ${source.name}...`);
      const t0 = Date.now();
      const items = await source.fn();
      const t1 = Date.now();
      const ms = t1 - t0;

      console.log(`    ✅ 成功，${items.length} 条，耗时 ${ms}ms`);
      runResult.sources[source.name] = {
        success: true,
        count: items.length,
        time_ms: ms,
        first_items: items.slice(0, 3).map(i => ({ title: i.title?.slice(0, 100), url: i.url?.slice(0, 100) }))
      };
    } catch (err) {
      console.error(`    ❌ 失败: ${err.message}`);
      runResult.sources[source.name] = { success: false, error: err.message };
    }
  }
  allResults.push(runResult);

  if (run < 4) {
    console.log("  等待 1 秒...");
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log("\n" + "=".repeat(70));
console.log("\n🎉 批量测试完成！完整结果：\n");
console.log(JSON.stringify(allResults, null, 2));

console.log("\n===== 简要总结 =====");
for (const r of allResults) {
  const successCount = Object.values(r.sources).filter(s => s.success).length;
  const totalItems = Object.values(r.sources).filter(s => s.success).reduce((sum, s) => sum + s.count, 0);
  console.log(`第 ${r.run} 次: ${successCount}/${sources.length} 成功, 共 ${totalItems} 条数据`);
}
