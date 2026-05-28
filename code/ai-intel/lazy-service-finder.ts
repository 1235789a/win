import fetch from "node-fetch";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const db = new Database("./data/intel.db");

// ============ 懒人服务核心筛选逻辑 ============

// 适合懒人服务的GitHub主题关键词
const LAZY_SERVICE_PATTERNS = [
  // CLI工具类
  "cli", "command-line", "bash", "shell", "script", "terminal",
  // 数据转换/处理
  "converter", "parser", "transform", "extract", "scraper", "crawler",
  "scraping", "harvest", "scrape", "parse", "normalize", "convert",
  // 自动化
  "automation", "workflow", "pipeline", "runner", "executor",
  // 媒体处理（避开whisper/ffmpeg这种太普遍的）
  "image", "photo", "picture", "resize", "compress", "thumbnail", "screenshot",
  // 数据格式
  "csv", "json", "xml", "yaml", "toml", "markdown", "html", "sitemap",
  // 办公文档
  "office", "word", "spreadsheet", "presentation", "docx", "xlsx",
  // 浏览器/网页
  "browser", "headless", "puppeteer", "playwright", "selenium", "spider",
  // API服务
  "api", "server", "proxy", "gateway", "reverse-proxy",
  // 数据库
  "database", "db", "sqlite", "mongodb", "postgres", "mysql", "redis",
  // 监控/日志
  "monitor", "logging", "log", "analytics", "tracking",
  // 安全
  "security", "scan", "vulnerability", "detect", "audit",
  // SEO
  "seo", "meta", "sitemap", "robots", "google",
  // 社交媒体
  "twitter", "instagram", "tiktok", "social", "scraper",
  // 电商
  "ecommerce", "shopify", "amazon", "product", "price",
];

// 排除太普遍的类型（用户明确要求）
const EXCLUDED_PATTERNS = [
  "whisper", "audio", "voice", "speech", "tts", "stt",
  "ffmpeg", "video", "transcribe",
  "pdf", // PDF太普遍
  "chatgpt", "openai", "llm", "gpt", "llama", // AI模型太普遍
  "slack", "discord", "telegram", "whatsapp", // 通讯工具
  "crm", "crm", "salesforce", // CRM太普遍
  "bot", "telegram-bot", "slack-bot", // 通用Bot
];

// 懒人服务评分函数
function scoreLazyService(repo) {
  const text = `${repo.name} ${repo.description || ""} ${(repo.topics || []).join(" ")} ${repo.language || ""}`.toLowerCase();
  
  let score = 0;
  
  // 1. GitHub Stars (0-30分)
  if (repo.stargazers_count > 50000) score += 30;
  else if (repo.stargazers_count > 20000) score += 25;
  else if (repo.stargazers_count > 10000) score += 20;
  else if (repo.stargazers_count > 5000) score += 15;
  else if (repo.stargazers_count > 1000) score += 10;
  else score += 5;
  
  // 2. CLI工具特征 (25分)
  if (/cli|command.?line|bash|shell|terminal|script|runner|executor/i.test(text)) {
    score += 25;
  }
  
  // 3. 数据转换/处理能力 (25分)
  if (/converter|parser|transform|extract|scraper|crawl|scrape|parse|convert/i.test(text)) {
    score += 25;
  }
  
  // 4. 自动化能力 (15分)
  if (/automation|workflow|pipeline|job|schedule/i.test(text)) {
    score += 15;
  }
  
  // 5. API/服务化能力 (10分)
  if (/api|server|service|endpoint|rest|graphql/i.test(text)) {
    score += 10;
  }
  
  // 6. 媒体处理（非通用类型）(10分)
  if (/image|photo|picture|thumbnail|screenshot|resize|compress/i.test(text) && 
      !/video|audio|voice/i.test(text)) {
    score += 10;
  }
  
  // 7. 数据格式转换 (10分)
  if (/csv|json|xml|yaml|markdown|html|sitemap/i.test(text)) {
    score += 10;
  }
  
  // 8. 浏览器自动化 (15分)
  if (/browser|headless|puppeteer|playwright|selenium|spider/i.test(text)) {
    score += 15;
  }
  
  // ============ 减分项 ============
  
  // 排除太普遍的类型
  if (EXCLUDED_PATTERNS.some(p => text.includes(p))) {
    score = 0;
  }
  
  // 纯AI/模型项目减分（不够垂直）
  if (/ai|model|training|machine.?learning|lora|fine.?tune/i.test(text) && 
      !/converter|parser|scraper/i.test(text)) {
    score -= 15;
  }
  
  // 代码开发工具减分（目标用户太专业）
  if (/git|github|code|ide|editor|debug/i.test(text) && 
      !/scraper|parser|converter/i.test(text)) {
    score -= 20;
  }
  
  // 文档类减分（PDF太普遍）
  if (/pdf|docx|word|document/i.test(text) && 
      !/converter|transform|parse/i.test(text)) {
    score -= 10;
  }
  
  return Math.max(0, score);
}

// 预测懒人服务形态
function predictServiceType(repo) {
  const text = `${repo.name} ${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();
  
  if (/scraper|crawl|scrape|browser|headless/i.test(text)) {
    return "🌐 网页爬虫API";
  }
  if (/converter|parser|transform|convert|extract/i.test(text)) {
    return "🔄 数据转换API";
  }
  if (/image|photo|picture|thumbnail|screenshot/i.test(text)) {
    return "🖼️ 图片处理API";
  }
  if (/csv|json|xml|yaml|markdown|html/i.test(text)) {
    return "📊 格式转换API";
  }
  if (/cli|command|script|runner|executor/i.test(text)) {
    return "⚡ 自动化工具API";
  }
  if (/api|server|proxy|gateway/i.test(text)) {
    return "🔌 API代理服务";
  }
  if (/seo|meta|sitemap|robots/i.test(text)) {
    return "🔍 SEO分析API";
  }
  if (/database|db|sqlite|mongodb|postgres/i.test(text)) {
    return "💾 数据库工具API";
  }
  if (/monitor|analytics|tracking|log/i.test(text)) {
    return "📈 监控分析API";
  }
  if (/security|scan|vulnerability|audit/i.test(text)) {
    return "🔒 安全扫描API";
  }
  
  return "🔧 工具服务API";
}

// ============ 主程序 ============

async function fetchGitHubProjects(query, perPage = 30) {
  console.log(`\n🔍 搜索: ${query}`);
  
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "AI-Intel-Lazy-Service-Finder"
    }
  });
  
  if (!response.ok) {
    console.error(`❌ 请求失败: ${response.status}`);
    return [];
  }
  
  const data = await response.json();
  console.log(`   找到 ${data.total_count} 个项目，显示前 ${data.items.length} 个`);
  
  return data.items;
}

async function main() {
  console.log("🎯 懒人服务挖掘器 - GitHub开源项目深度分析");
  console.log("=".repeat(80));
  console.log("筛选标准: CLI工具 | 数据转换 | 自动化脚本 | API服务化");
  console.log("排除类型: 语音/视频/文档转换 | 通用AI/LLM | 通讯工具 | CRM\n");
  
  // 多维度搜索GitHub项目
  const queries = [
    // CLI工具类
    "cli tool scraper stars:>1000",
    "command line converter parser stars:>1000",
    "bash script automation stars:>2000",
    // 数据转换
    "data parser extractor transformer stars:>1000",
    "web scraper crawler python stars:>5000",
    // 自动化
    "automation workflow runner stars:>1000",
    // 图片处理（避开视频音频）
    "image processing CLI stars:>500",
    "thumbnail generator CLI stars:>500",
    // 格式转换
    "csv json converter parser stars:>1000",
    "markdown converter parser stars:>500",
    // API服务
    "REST API server CLI stars:>1000",
    // SEO工具
    "SEO analyzer scraper stars:>500",
    // 浏览器自动化
    "headless browser automation stars:>1000",
    // 监控
    "monitoring logging CLI stars:>500",
    // 数据库工具
    "database migration CLI stars:>500",
  ];
  
  const allRepos = [];
  const seenUrls = new Set();
  
  for (const query of queries) {
    const repos = await fetchGitHubProjects(query, 30);
    
    for (const repo of repos) {
      if (!seenUrls.has(repo.html_url)) {
        seenUrls.add(repo.html_url);
        
        const score = scoreLazyService(repo);
        const serviceType = predictServiceType(repo);
        
        allRepos.push({
          ...repo,
          lazyScore: score,
          serviceType
        });
      }
    }
    
    // 避免GitHub API限流
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // 按懒人服务评分排序
  allRepos.sort((a, b) => b.lazyScore - a.lazyScore);
  
  // 去重（同项目只保留最高分）
  const uniqueRepos = [];
  const seenNames = new Set();
  for (const repo of allRepos) {
    if (!seenNames.has(repo.name)) {
      seenNames.add(repo.name);
      uniqueRepos.push(repo);
    }
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 分析完成: 共收集 ${uniqueRepos.length} 个候选项目`);
  console.log(`${"=".repeat(80)}\n`);
  
  // 显示Top 20最适合做懒人服务的项目
  console.log("🏆 TOP 20 最适合做懒人服务的GitHub开源项目:\n");
  
  const topRepos = uniqueRepos.filter(r => r.lazyScore > 20).slice(0, 20);
  
  topRepos.forEach((repo, i) => {
    console.log(`${i + 1}. ${repo.name} ⭐${repo.stargazers_count} | ${repo.language || 'N/A'} | 评分:${repo.lazyScore}`);
    console.log(`   📌 ${repo.description || 'No description'}`);
    console.log(`   🔮 懒人服务形态: ${repo.serviceType}`);
    console.log(`   🔗 ${repo.html_url}`);
    console.log(`   🏷️ ${(repo.topics || []).slice(0, 5).join(', ')}`);
    console.log("");
  });
  
  // 保存到数据库
  console.log(`${"=".repeat(80)}`);
  console.log("💾 保存到数据库...\n");
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO opportunities (
      source_platform, source_url, raw_text, title, target_niche,
      pain_point_analysis, build_once_sell_infinite, score, priority, tags,
      analysis_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const repo of topRepos) {
    const rawText = JSON.stringify({
      platform: "github",
      url: repo.html_url,
      title: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics
    });
    
    insertStmt.run(
      "github",
      repo.html_url,
      rawText,
      repo.name,
      "普通用户/小型企业",
      `懒人服务: ${repo.serviceType}。${repo.description}`,
      1, // build_once_sell_infinite
      repo.lazyScore,
      repo.lazyScore > 60 ? "P0" : "P1",
      (repo.topics || []).join(","),
      JSON.stringify({
        lazy_service: true,
        service_type: repo.serviceType,
        stars: repo.stargazers_count,
        cli_features: /cli|command|script/i.test(repo.name + repo.description)
      })
    );
  }
  
  console.log(`✅ 成功保存 ${topRepos.length} 个懒人服务候选项目到数据库`);
  
  // 生成懒人服务分析报告
  console.log(`\n${"=".repeat(80)}`);
  console.log("📋 懒人服务变现分析报告\n");
  
  topRepos.slice(0, 5).forEach((repo, i) => {
    console.log(`【项目 ${i + 1}: ${repo.name}】`);
    console.log(`⭐ GitHub Stars: ${repo.stargazers_count}`);
    console.log(`🔮 懒人服务形态: ${repo.serviceType}`);
    console.log(`📝 描述: ${repo.description}`);
    console.log(`💡 变现思路:`);
    
    // 根据项目类型生成具体变现建议
    if (repo.serviceType.includes("爬虫")) {
      console.log(`   - 开发网页数据爬取API服务`);
      console.log(`   - 定价: $0.01-0.1/页面`);
      console.log(`   - 目标用户: 竞品分析、市场研究、数据分析师`);
      console.log(`   - 成本: 接近0（开源工具）`);
    } else if (repo.serviceType.includes("转换")) {
      console.log(`   - 开发数据格式转换API`);
      console.log(`   - 定价: $0.001-0.01/转换`);
      console.log(`   - 目标用户: 开发者、数据工程师`);
      console.log(`   - 成本: 接近0（开源工具）`);
    } else if (repo.serviceType.includes("图片")) {
      console.log(`   - 开发图片处理API服务`);
      console.log(`   - 定价: $0.01-0.05/图片`);
      console.log(`   - 目标用户: 电商、设计师、社交媒体运营`);
      console.log(`   - 成本: 接近0（开源工具）`);
    } else {
      console.log(`   - 开发自动化工具API服务`);
      console.log(`   - 定价: 订阅制 $9-99/月 或 按次计费`);
      console.log(`   - 目标用户: 开发者/小型企业`);
      console.log(`   - 成本: 接近0（开源工具）`);
    }
    
    console.log("");
  });
}

main().catch(console.error);
