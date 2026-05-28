// ============================================
// 懒人服务挖掘器 v2.0 - 综合分析报告
// ============================================

// 整合所有抓取的GitHub项目数据
const GITHUB_PROJECTS = [
  // ============ 数据爬取/转换类 ============
  { name: "firecrawl", stars: 125559, desc: "Search, scrape, and clean the web for AI agents", url: "https://github.com/firecrawl/firecrawl", lang: "TypeScript", category: "🌐 数据爬虫", difficulty: "中" },
  { name: "crawl4ai", stars: 66735, desc: "Open-source LLM Friendly Web Crawler & Scraper", url: "https://github.com/unclecode/crawl4ai", lang: "Python", category: "🌐 数据爬虫", difficulty: "低" },
  { name: "MinerU", stars: 65441, desc: "Transforms complex documents into LLM-ready markdown/JSON", url: "https://github.com/opendatalab/MinerU", lang: "Python", category: "📄 文档处理", difficulty: "中" },
  { name: "scrapy", stars: 61942, desc: "Fast high-level web crawling & scraping framework", url: "https://github.com/scrapy/scrapy", lang: "Python", category: "🌐 数据爬虫", difficulty: "中" },
  { name: "MediaCrawler", stars: 50342, desc: "小红书、抖音、快手、B站、微博爬虫", url: "https://github.com/NanmiCoder/MediaCrawler", lang: "Python", category: "📱 社交媒体", difficulty: "中" },
  { name: "cheerio", stars: 30343, desc: "Fast, flexible library for parsing and manipulating HTML", url: "https://github.com/cheeriojs/cheerio", lang: "TypeScript", category: "🔧 数据解析", difficulty: "低" },
  { name: "colly", stars: 25300, desc: "Elegant Scraper and Crawler Framework for Golang", url: "https://github.com/gocolly/colly", lang: "Go", category: "🌐 数据爬虫", difficulty: "中" },
  { name: "crawlee", stars: 23532, desc: "Web scraping and browser automation library for Node.js", url: "https://github.com/apify/crawlee", lang: "TypeScript", category: "🌐 数据爬虫", difficulty: "低" },

  // ============ API/服务器类 ============
  { name: "hoppscotch", stars: 79341, desc: "Open-Source API Development Ecosystem, Alternative to Postman", url: "https://github.com/hoppscotch/hoppscotch", lang: "TypeScript", category: "🔌 API工具", difficulty: "低" },
  { name: "json-server", stars: 75586, desc: "Get a full fake REST API with zero coding in less than 30 seconds", url: "https://github.com/typicode/json-server", lang: "JavaScript", category: "🔌 API工具", difficulty: "极低" },
  { name: "frp", stars: 106913, desc: "A fast reverse proxy to help you expose a local server behind a NAT", url: "https://github.com/fatedier/frp", lang: "Go", category: "🌐 网络代理", difficulty: "中" },
  { name: "caddy", stars: 72799, desc: "Fast and extensible multi-platform HTTP/1-2-3 web server", url: "https://github.com/caddyserver/caddy", lang: "Go", category: "🌐 Web服务器", difficulty: "中" },
  { name: "traefik", stars: 63342, desc: "The Cloud Native Application Proxy", url: "https://github.com/traefik/traefik", lang: "Go", category: "🌐 负载均衡", difficulty: "中" },
  { name: "strapi", stars: 72265, desc: "The leading open-source headless CMS", url: "https://github.com/strapi/strapi", lang: "TypeScript", category: "📝 CMS系统", difficulty: "中" },

  // ============ 通知/消息类 ============
  { name: "novu", stars: 39035, desc: "The open-source notification infrastructure", url: "https://github.com/novuhq/novu", lang: "TypeScript", category: "📬 通知服务", difficulty: "中" },
  { name: "ntfy", stars: 30438, desc: "Send push notifications to your phone or desktop using PUT/POST", url: "https://github.com/binwiederhier/ntfy", lang: "Go", category: "📬 通知服务", difficulty: "极低" },
  { name: "chatwoot", stars: 29795, desc: "Open-source live-chat, email support, omni-channel desk", url: "https://github.com/chatwoot/chatwoot", lang: "Ruby", category: "💬 客服系统", difficulty: "高" },
  { name: "react-email", stars: 19252, desc: "Build and send emails using React", url: "https://github.com/resend/react-email", lang: "TypeScript", category: "📧 邮件服务", difficulty: "低" },
  { name: "apprise", stars: 16647, desc: "Push Notifications that work with just about every platform", url: "https://github.com/caronc/apprise", lang: "Python", category: "📬 通知服务", difficulty: "极低" },
  { name: "mjml", stars: 18075, desc: "The only framework that makes responsive-email easy", url: "https://github.com/mjmlio/mjml", lang: "JavaScript", category: "📧 邮件模板", difficulty: "低" },

  // ============ 数据可视化/分析类 ============
  { name: "grafana", stars: 74007, desc: "Open and composable observability and data visualization platform", url: "https://github.com/grafana/grafana", lang: "TypeScript", category: "📊 数据可视化", difficulty: "高" },
  { name: "superset", stars: 73053, desc: "Data Visualization and Data Exploration Platform", url: "https://github.com/apache/superset", lang: "TypeScript", category: "📊 数据可视化", difficulty: "高" },
  { name: "metabase", stars: 47476, desc: "Easy-to-use open source Business Intelligence tool", url: "https://github.com/metabase/metabase", lang: "Clojure", category: "📊 数据可视化", difficulty: "中" },
  { name: "umami", stars: 36891, desc: "Modern, privacy-focused analytics platform. Alternative to Google Analytics", url: "https://github.com/umami-software/umami", lang: "TypeScript", category: "📈 网站统计", difficulty: "中" },
  { name: "posthog", stars: 34736, desc: "All-in-one developer platform for building successful products", url: "https://github.com/PostHog/posthog", lang: "Python", category: "📈 产品分析", difficulty: "高" },

  // ============ 监控/运维类 ============
  { name: "uptime-kuma", stars: 87366, desc: "Fancy self-hosted monitoring tool", url: "https://github.com/louislam/uptime-kuma", lang: "JavaScript", category: "🖥️ 监控告警", difficulty: "低" },
  { name: "TrendRadar", stars: 58504, desc: "AI-driven public opinion & trend monitor", url: "https://github.com/sansan0/TrendRadar", lang: "Python", category: "📡 舆情监控", difficulty: "中" },
  { name: "sentry", stars: 43983, desc: "Developer-first error tracking and performance monitoring", url: "https://github.com/getsentry/sentry", lang: "Python", category: "🐛 错误追踪", difficulty: "高" },

  // ============ 自动化/工作流类 ============
  { name: "n8n", stars: 39035, desc: "Workflow automation tool for developers", url: "https://github.com/n8n-io/n8n", lang: "TypeScript", category: "⚡ 工作流", difficulty: "中" },
  { name: "huginn", stars: 49342, desc: "Create agents that monitor and act on your behalf", url: "https://github.com/huginn/huginn", lang: "Ruby", category: "🤖 自动化代理", difficulty: "高" },
  { name: "airflow", stars: 45560, desc: "Programmatically author, schedule, and monitor workflows", url: "https://github.com/apache/airflow", lang: "Python", category: "⚡ 数据管道", difficulty: "高" },

  // ============ 媒体/图片处理类 ============
  { name: "PaddleOCR", stars: 78822, desc: "Turn any PDF or image document into structured data", url: "https://github.com/PaddlePaddle/PaddleOCR", lang: "Python", category: "🖼️ OCR识别", difficulty: "中" },
  { name: "screenshot-to-code", stars: 72709, desc: "Drop in a screenshot and convert it to clean code", url: "https://github.com/abi/screenshot-to-code", lang: "TypeScript", category: "📸 设计转码", difficulty: "低" },
  { name: "upscayl", stars: 45581, desc: "Free and Open Source AI Image Upscaler", url: "https://github.com/upscayl/upscayl", lang: "TypeScript", category: "🖼️ 图片处理", difficulty: "中" },
  { name: "html2canvas", stars: 31866, desc: "Screenshots with JavaScript", url: "https://github.com/niklasvh/html2canvas", lang: "TypeScript", category: "📸 网页截图", difficulty: "极低" },

  // ============ 文档/格式转换类 ============
  { name: "pandoc", stars: 44409, desc: "Universal markup converter", url: "https://github.com/jgm/pandoc", lang: "Haskell", category: "🔄 格式转换", difficulty: "极低" },
  { name: "marked", stars: 36846, desc: "Markdown parser and compiler", url: "https://github.com/markedjs/marked", lang: "JavaScript", category: "📝 Markdown", difficulty: "极低" },

  // ============ 数据库工具类 ============
  { name: "redis", stars: 74569, desc: "In-memory data structure store, database, cache, message broker", url: "https://github.com/redis/redis", lang: "C", category: "💾 数据库", difficulty: "高" },
  { name: "duckdb", stars: 38472, desc: "Analytical in-process SQL database management system", url: "https://github.com/duckdb/duckdb", lang: "C++", category: "💾 OLAP数据库", difficulty: "中" },
  { name: "hasura", stars: 31974, desc: "Blazing fast, instant realtime GraphQL APIs", url: "https://github.com/hasura/graphql-engine", lang: "TypeScript", category: "🔌 GraphQL", difficulty: "中" },

  // ============ 开发工具类 ============
  { name: "code-server", stars: 77753, desc: "VS Code in the browser", url: "https://github.com/coder/code-server", lang: "TypeScript", category: "💻 云IDE", difficulty: "中" },
  { name: "puppeteer", stars: 94382, desc: "JavaScript API for Chrome and Firefox", url: "https://github.com/puppeteer/puppeteer", lang: "TypeScript", category: "🤖 浏览器自动化", difficulty: "中" },
  { name: "playwright", stars: 89711, desc: "Framework for Web Testing and Automation", url: "https://github.com/microsoft/playwright", lang: "TypeScript", category: "🤖 浏览器自动化", difficulty: "中" },
  { name: "fastapi", stars: 98594, desc: "FastAPI framework, high performance, easy to learn", url: "https://github.com/fastapi/fastapi", lang: "Python", category: "🐍 Python框架", difficulty: "低" },
  { name: "gin", stars: 88558, desc: "High-performance HTTP web framework written in Go", url: "https://github.com/gin-gonic/gin", lang: "Go", category: "🌐 Go框架", difficulty: "中" },

  // ============ AI/LLM工具类 ============
  { name: "litellm", stars: 48551, desc: "Proxy Server to call 100+ LLM APIs", url: "https://github.com/BerriAI/litellm", lang: "Python", category: "🤖 AI网关", difficulty: "中" },
  { name: "lobehub", stars: 77863, desc: "Chief Agent Operator, organizing your AI agents", url: "https://github.com/lobehub/lobehub", lang: "TypeScript", category: "🤖 AI管理", difficulty: "中" },
];

// ============================================
// 懒人服务评分函数
// ============================================

function scoreLazyService(project) {
  const text = `${project.name} ${project.desc} ${project.category}`.toLowerCase();
  
  let score = 0;
  
  // 1. GitHub Stars (0-25分)
  if (project.stars > 100000) score += 25;
  else if (project.stars > 50000) score += 20;
  else if (project.stars > 30000) score += 15;
  else if (project.stars > 10000) score += 10;
  else if (project.stars > 5000) score += 5;
  else score += 3;
  
  // 2. CLI工具/API服务化潜力 (20分)
  if (/api|server|service|proxy|gateway|endpoint|rest|graphql/i.test(text)) {
    score += 20;
  }
  
  // 3. 数据处理/转换能力 (20分)
  if (/scraper|crawler|parser|converter|extract|transform|convert|automation/i.test(text)) {
    score += 20;
  }
  
  // 4. 易于Web化 (15分)
  if (project.difficulty === "极低" || project.difficulty === "低") {
    score += 15;
  } else if (project.difficulty === "中") {
    score += 10;
  }
  
  // 5. 商业化潜力 - 有明确付费场景 (15分)
  const commercialPatterns = [
    "analytics", "tracking", "monitor", "notification", "email",
    "api", "gateway", "proxy", "scraper", "crawler",
    "ecommerce", "shopify", "price", "product",
    "seo", "marketing", "crm", "sales",
    "automation", "workflow", "pipeline"
  ];
  
  if (commercialPatterns.some(p => text.includes(p))) {
    score += 15;
  }
  
  // 6. 目标用户广泛 (5分)
  if (/web|site|page|html|email|notification|analytics/i.test(text)) {
    score += 5;
  }
  
  return Math.min(100, score);
}

// 预测懒人服务形态
function predictServiceType(project) {
  const text = `${project.name} ${project.desc} ${project.category}`.toLowerCase();
  
  if (/scraper|crawl|web.*data/i.test(text)) {
    return "🌐 数据爬取API";
  }
  if (/analytics|tracking|stat/i.test(text)) {
    return "📈 网站分析API";
  }
  if (/monitor|uptime|health/i.test(text)) {
    return "🖥️ 监控告警API";
  }
  if (/notification|push|alert/i.test(text)) {
    return "📬 通知推送API";
  }
  if (/email|mail/i.test(text)) {
    return "📧 邮件服务API";
  }
  if (/api|test|client|postman/i.test(text)) {
    return "🔌 API开发工具";
  }
  if (/proxy|reverse|server|frp|expose/i.test(text)) {
    return "🌐 内网穿透/代理";
  }
  if (/ocr|document|image.*text/i.test(text)) {
    return "🖼️ 文档识别API";
  }
  if (/screenshot|capture/i.test(text)) {
    return "📸 网页截图API";
  }
  if (/workflow|automation|agent/i.test(text)) {
    return "⚡ 自动化API";
  }
  if (/trend|opinion|public.*opinion/i.test(text)) {
    return "📡 舆情监控API";
  }
  
  return "🔧 工具服务API";
}

// ============================================
// 生成变现分析
// ============================================

function generateMonetizationAdvice(project, serviceType) {
  const advice = {
    serviceType: serviceType,
    targetUsers: [],
    pricing: {},
    cost: 0,
    difficulty: project.difficulty,
    advantage: ""
  };
  
  if (serviceType.includes("爬取") || serviceType.includes("爬虫")) {
    advice.targetUsers = ["数据分析师", "市场研究人员", "SEO从业者", "学术研究者", "竞品分析团队"];
    advice.pricing = { "按页面": "$0.01-0.1", "包月": "$29-199", "企业API": "$499+/月" };
    advice.advantage = "用户无需写爬虫代码，直接上传URL即可获取结构化数据";
  }
  else if (serviceType.includes("分析")) {
    advice.targetUsers = ["网站运营", "营销人员", "产品经理", "数据分析师"];
    advice.pricing = { "按PV": "$0.001", "包月": "$9-49", "企业版": "$199+/月" };
    advice.advantage = "替代Google Analytics，隐私合规，数据自主可控";
  }
  else if (serviceType.includes("监控")) {
    advice.targetUsers = ["开发者", "运维人员", "SRE", "网站管理员"];
    advice.pricing = { "按监控点": "$5-20/月", "包月": "$29-99", "企业版": "$299+/月" };
    advice.advantage = "网站宕机即时告警，支持多渠道通知";
  }
  else if (serviceType.includes("通知") || serviceType.includes("推送")) {
    advice.targetUsers = ["开发者", "系统管理员", "运营人员"];
    advice.pricing = { "按发送": "$0.001", "包月": "$9-29", "API套餐": "$49+/月" };
    advice.advantage = "一行代码集成多渠道通知（钉钉/飞书/Slack/邮件）";
  }
  else if (serviceType.includes("邮件")) {
    advice.targetUsers = ["营销人员", "开发者", "电商运营", "内容创作者"];
    advice.pricing = { "按封": "$0.001-0.01", "包月": "$19-99", "企业版": "$299+/月" };
    advice.advantage = "拖拽式邮件模板，开发者的邮件API";
  }
  else if (serviceType.includes("截图")) {
    advice.targetUsers = ["设计师", "开发者", "内容创作者", "SEO从业者"];
    advice.pricing = { "按截图": "$0.05-0.2", "包月": "$19-49", "API调用": "$0.01/次" };
    advice.advantage = "输入URL即可获取完美截图，支持多设备和分辨率";
  }
  else if (serviceType.includes("API")) {
    advice.targetUsers = ["开发者", "API集成商", "测试工程师"];
    advice.pricing = { "按调用": "$0.001-0.01", "包月": "$29-99", "企业API": "$199+/月" };
    advice.advantage = "Postman的开源替代品，更好的开发体验";
  }
  else if (serviceType.includes("代理") || serviceType.includes("穿透")) {
    advice.targetUsers = ["开发者", "运维人员", "远程办公者"];
    advice.pricing = { "按流量": "$0.01/GB", "包月": "$5-29", "企业版": "$99+/月" };
    advice.advantage = "替代ngrok，免费且功能更强";
  }
  else if (serviceType.includes("文档") || serviceType.includes("OCR")) {
    advice.targetUsers = ["办公人群", "档案管理人员", "律师", "会计"];
    advice.pricing = { "按页": "$0.01-0.05", "包月": "$19-99", "批量处理": "$99+" };
    advice.advantage = "图片/PDF转文字，完全免费开源";
  }
  else if (serviceType.includes("自动化") || serviceType.includes("工作流")) {
    advice.targetUsers = ["运营人员", "开发者", "项目经理"];
    advice.pricing = { "按执行": "$0.01", "包月": "$29-99", "企业版": "$299+/月" };
    advice.advantage = "Zapier的开源替代品，无需订阅";
  }
  else if (serviceType.includes("舆情")) {
    advice.targetUsers = ["品牌方", "营销团队", "投资人", "记者", "政府机构"];
    advice.pricing = { "按监控": "$29-99/月", "深度分析": "$199+/月", "定制报告": "$999+" };
    advice.advantage = "AI驱动的舆情分析，多平台聚合";
  }
  else {
    advice.targetUsers = ["开发者", "小型企业", "个人用户"];
    advice.pricing = { "按次": "$0.01-0.1", "包月": "$19-99" };
    advice.advantage = "把复杂开源工具变成简单易用的在线服务";
  }
  
  return advice;
}

// ============================================
// 主程序
// ============================================

function main() {
  console.log("=" .repeat(100));
  console.log("🎯 懒人服务挖掘器 v2.0 - GitHub开源项目 × 懒人服务变现分析");
  console.log("=" .repeat(100));
  console.log("\n📌 核心策略：把GitHub开源CLI工具翻译成懒人服务");
  console.log("📌 新增类别：通知服务 | API工具 | 监控告警 | 数据可视化\n");
  
  // 计算每个项目的懒人服务评分
  const scoredProjects = GITHUB_PROJECTS.map(project => ({
    ...project,
    lazyScore: scoreLazyService(project),
    serviceType: predictServiceType(project)
  }));
  
  // 按懒人服务评分排序
  scoredProjects.sort((a, b) => b.lazyScore - a.lazyScore);
  
  // 过滤出评分 > 40的项目
  const topProjects = scoredProjects.filter(p => p.lazyScore > 40);
  
  console.log("=" .repeat(100));
  console.log(`🏆 TOP ${topProjects.length} 最适合做懒人服务的GitHub开源项目\n`);
  
  // 显示Top项目
  topProjects.slice(0, 20).forEach((project, i) => {
    const diff_emoji = project.difficulty === "极低" ? "🟢" : 
                       project.difficulty === "低" ? "🟢" :
                       project.difficulty === "中" ? "🟡" : "🔴";
    
    console.log(`${i + 1}. ${project.name} ⭐${project.stars} | ${diff_emoji}${project.difficulty} | 评分: ${project.lazyScore}`);
    console.log(`   📌 ${project.desc}`);
    console.log(`   🔮 懒人服务形态: ${project.serviceType}`);
    console.log(`   🏷️ 分类: ${project.category}`);
    console.log(`   🔗 ${project.url}`);
    console.log("");
  });
  
  // 生成详细变现分析
  console.log("\n" + "=" .repeat(100));
  console.log("📋 懒人服务变现详细分析报告\n");
  
  topProjects.slice(0, 15).forEach((project, i) => {
    const advice = generateMonetizationAdvice(project, project.serviceType);
    
    console.log("-".repeat(80));
    console.log(`【项目 ${i + 1}: ${project.name}】`);
    console.log("-".repeat(80));
    console.log(`⭐ GitHub Stars: ${project.stars}`);
    console.log(`🔮 懒人服务形态: ${advice.serviceType}`);
    console.log(`📝 描述: ${project.desc}`);
    console.log(`🏷️ 技术栈: ${project.lang}`);
    console.log(`📊 懒人服务评分: ${project.lazyScore}/100`);
    console.log(`⚡ 实施难度: ${project.difficulty}`);
    console.log("");
    
    console.log("💰 变现建议:");
    console.log("   👥 目标用户:");
    advice.targetUsers.slice(0, 4).forEach(user => console.log(`      - ${user}`));
    console.log("");
    
    console.log("   💵 定价策略:");
    Object.entries(advice.pricing).forEach(([type, price]) => {
      console.log(`      - ${type}: ${price}`);
    });
    console.log("");
    
    console.log("   💵 成本: 接近$0（开源工具）");
    console.log("");
    
    console.log("   🏆 竞争优势:");
    console.log(`      ${advice.advantage}`);
    console.log("");
  });
  
  // 赛道分类总结
  console.log("\n" + "=" .repeat(100));
  console.log("📊 懒人服务赛道分类总结\n");
  
  const categories = {};
  topProjects.forEach(p => {
    const cat = p.category;
    if (!categories[cat]) categories[cat] = { count: 0, projects: [], avgScore: 0 };
    categories[cat].count++;
    categories[cat].projects.push(p.name);
    categories[cat].avgScore += p.lazyScore;
  });
  
  Object.entries(categories).sort((a, b) => b[1].count - a[1].count).forEach(([cat, data]) => {
    const avgScore = Math.round(data.avgScore / data.count);
    console.log(`${cat} (${data.count}个项目, 平均评分: ${avgScore})`);
    console.log(`   候选: ${data.projects.slice(0, 5).join(', ')}${data.projects.length > 5 ? '...' : ''}`);
    console.log("");
  });
  
  // 推荐赛道
  console.log("=" .repeat(100));
  console.log("🎯 推荐优先尝试的懒人服务赛道\n");
  
  const recommendations = [
    { 
      name: "🌐 数据爬取API服务",
      reason: "需求旺盛，技术成熟，定价灵活",
      tools: ["firecrawl", "crawl4ai", "cheerio"],
      revenue: "$1000-10000/月"
    },
    { 
      name: "📬 通知推送API服务",
      reason: "开发者刚需，集成简单，付费意愿强",
      tools: ["novu", "ntfy", "apprise"],
      revenue: "$500-5000/月"
    },
    { 
      name: "🔌 API开发工具",
      reason: "替代Postman，开发者付费意愿高",
      tools: ["hoppscotch", "json-server"],
      revenue: "$500-3000/月"
    },
    { 
      name: "🖥️ 监控告警API服务",
      reason: "运维必备，替代付费SaaS",
      tools: ["uptime-kuma"],
      revenue: "$300-2000/月"
    },
    { 
      name: "📈 网站分析API服务",
      reason: "隐私合规趋势，替代GA",
      tools: ["umami"],
      revenue: "$500-5000/月"
    },
    { 
      name: "📸 网页截图API服务",
      reason: "设计师和开发者刚需",
      tools: ["html2canvas", "screenshot-to-code"],
      revenue: "$300-2000/月"
    },
    { 
      name: "📡 舆情监控API服务",
      reason: "企业付费意愿强，客单价高",
      tools: ["TrendRadar"],
      revenue: "$2000-20000/月"
    },
    { 
      name: "⚡ 自动化工作流API",
      reason: "替代Zapier，开发者友好",
      tools: ["huginn", "airflow"],
      revenue: "$1000-10000/月"
    },
  ];
  
  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.name}`);
    console.log(`   💡 原因: ${rec.reason}`);
    console.log(`   🛠️ 可用工具: ${rec.tools.join(', ')}`);
    console.log(`   💰 预期月收入: ${rec.revenue}`);
    console.log("");
  });
  
  // 行动计划
  console.log("=" .repeat(100));
  console.log("📝 行动计划\n");
  console.log("   1️⃣ 选择赛道：从TOP 8推荐中选择1-2个最感兴趣的");
  console.log("   2️⃣ 快速验证：用开源工具部署Demo，24小时内上线");
  console.log("   3️⃣ 核心功能：先做最核心的1-2个功能");
  console.log("   4️⃣ 定价策略：按次计费 > 包月 > 企业定制");
  console.log("   5️⃣ 用户获取：开发者社区（Reddit/HN）> SEO > 内容营销");
  console.log("=" .repeat(100));
}

// 运行
main();
