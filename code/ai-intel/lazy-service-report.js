// ============================================
// 懒人服务挖掘器 - 综合分析报告生成器
// ============================================

// 已抓取的GitHub项目数据（整合多类别）
const GITHUB_PROJECTS = [
  // ============ 数据爬取/转换类 ============
  { name: "firecrawl", stars: 125559, desc: "Search, scrape, and clean the web for AI agents.", url: "https://github.com/firecrawl/firecrawl", lang: "TypeScript", topics: ["crawler","scraper","web-data","llm"] },
  { name: "crawl4ai", stars: 66735, desc: "Open-source LLM Friendly Web Crawler & Scraper", url: "https://github.com/unclecode/crawl4ai", lang: "Python", topics: ["crawler","scraper","llm"] },
  { name: "MinerU", stars: 65441, desc: "Transforms complex documents like PDFs and Office docs into LLM-ready markdown/JSON", url: "https://github.com/opendatalab/MinerU", lang: "Python", topics: ["pdf","docx","parser","extract-data"] },
  { name: "scrapy", stars: 61942, desc: "Fast high-level web crawling & scraping framework for Python", url: "https://github.com/scrapy/scrapy", lang: "Python", topics: ["crawler","scraping","python"] },
  { name: "Scrapling", stars: 54630, desc: "An adaptive Web Scraping framework", url: "https://github.com/D4Vinci/Scrapling", lang: "Python", topics: ["scraper","automation","playwright"] },
  { name: "MediaCrawler", stars: 50342, desc: "小红书、抖音、快手、B站、微博爬虫", url: "https://github.com/NanmiCoder/MediaCrawler", lang: "Python", topics: ["scraper","social-media","crawler"] },
  { name: "huginn", stars: 49342, desc: "Create agents that monitor and act on your behalf", url: "https://github.com/huginn/huginn", lang: "Ruby", topics: ["automation","agent","monitoring","scraper"] },
  { name: "EasySpider", stars: 43885, desc: "可视化无代码网页爬虫/数据采集软件", url: "https://github.com/NaiboWang/EasySpider", lang: "JavaScript", topics: ["scraper","visual","no-code","automation"] },
  { name: "cheerio", stars: 30343, desc: "Fast, flexible, and elegant library for parsing and manipulating HTML", url: "https://github.com/cheeriojs/cheerio", lang: "TypeScript", topics: ["parser","html","scraper"] },
  { name: "Scrapegraph-ai", stars: 26323, desc: "Python scraper based on AI", url: "https://github.com/ScrapeGraphAI/Scrapegraph-ai", lang: "Python", topics: ["ai-scraping","llm","web-crawler"] },
  { name: "colly", stars: 25300, desc: "Elegant Scraper and Crawler Framework for Golang", url: "https://github.com/gocolly/colly", lang: "Go", topics: ["scraper","crawler","golang"] },
  { name: "crawlee", stars: 23532, desc: "Web scraping and browser automation library for Node.js", url: "https://github.com/apify/crawlee", lang: "TypeScript", topics: ["scraper","playwright","puppeteer","automation"] },
  { name: "gpt-crawler", stars: 22237, desc: "Crawl a site to generate knowledge files for custom GPT", url: "https://github.com/BuilderIO/gpt-crawler", lang: "TypeScript", topics: ["ai","crawler"] },
  
  // ============ 图片处理类 ============
  { name: "Deep-Live-Cam", stars: 93398, desc: "Real time face swap and one-click video deepfake", url: "https://github.com/hacksider/Deep-Live-Cam", lang: "Python", topics: ["face-swap","deepfake","video"] },
  { name: "PaddleOCR", stars: 78822, desc: "Turn any PDF or image document into structured data", url: "https://github.com/PaddlePaddle/PaddleOCR", lang: "Python", topics: ["ocr","pdf","document"] },
  { name: "screenshot-to-code", stars: 72709, desc: "Drop in a screenshot and convert it to clean code", url: "https://github.com/abi/screenshot-to-code", lang: "TypeScript", topics: ["screenshot","code","converter"] },
  { name: "upscayl", stars: 45581, desc: "Free and Open Source AI Image Upscaler", url: "https://github.com/upscayl/upscayl", lang: "TypeScript", topics: ["image","ai","upscaler"] },
  { name: "Umi-OCR", stars: 44556, desc: "开源免费的离线OCR软件，支持图片和PDF", url: "https://github.com/hiroi-sora/Umi-OCR", lang: "Python", topics: ["ocr","pdf","image"] },
  { name: "ShareX", stars: 37787, desc: "Capture or record any area of screen, upload images/files", url: "https://github.com/ShareX/ShareX", lang: "C#", topics: ["screenshot","upload","sharing"] },
  { name: "carbon", stars: 36027, desc: "Create and share beautiful images of your source code", url: "https://github.com/carbon-app/carbon", lang: "JavaScript", topics: ["screenshot","code","image"] },
  { name: "Real-ESRGAN", stars: 35573, desc: "Practical Algorithms for General Image/Video Restoration", url: "https://github.com/xinntao/Real-ESRGAN", lang: "Python", topics: ["image","video","restoration","upscale"] },
  { name: "sharp", stars: 32272, desc: "High performance Node.js image processing", url: "https://github.com/lovell/sharp", lang: "JavaScript", topics: ["image","resize","process"] },
  { name: "html2canvas", stars: 31866, desc: "Screenshots with JavaScript", url: "https://github.com/niklasvh/html2canvas", lang: "TypeScript", topics: ["screenshot","html","canvas"] },
  { name: "czkawka", stars: 31234, desc: "Find duplicates, empty folders, similar images", url: "https://github.com/qarmin/czkawka", lang: "Fluent", topics: ["image","duplicate","cleaner"] },
  
  // ============ 格式转换类 ============
  { name: "pandoc", stars: 44409, desc: "Universal markup converter", url: "https://github.com/jgm/pandoc", lang: "Haskell", topics: ["converter","markdown","document"] },
  { name: "marked", stars: 36846, desc: "Markdown parser and compiler", url: "https://github.com/markedjs/marked", lang: "JavaScript", topics: ["markdown","parser","compiler"] },
  { name: "moment", stars: 47982, desc: "Parse, validate, manipulate, and display dates", url: "https://github.com/moment/moment", lang: "JavaScript", topics: ["date","parser","time"] },
  { name: "simdjson", stars: 23789, desc: "Parsing gigabytes of JSON per second", url: "https://github.com/simdjson/simdjson", lang: "C++", topics: ["json","parser","performance"] },
  { name: "tree-sitter", stars: 25582, desc: "Incremental parsing system for programming tools", url: "https://github.com/tree-sitter/tree-sitter", lang: "Rust", topics: ["parser","syntax","tree"] },
  
  // ============ 监控/分析类 ============
  { name: "uptime-kuma", stars: 87366, desc: "Fancy self-hosted monitoring tool", url: "https://github.com/louislam/uptime-kuma", lang: "JavaScript", topics: ["monitoring","uptime","server"] },
  { name: "TrendRadar", stars: 58503, desc: "AI-driven public opinion & trend monitor", url: "https://github.com/sansan0/TrendRadar", lang: "Python", topics: ["monitoring","ai","news","rss"] },
  { name: "litellm", stars: 48549, desc: "Proxy Server to call 100+ LLM APIs with cost tracking", url: "https://github.com/BerriAI/litellm", lang: "Python", topics: ["llm","proxy","gateway"] },
  { name: "sentry", stars: 43983, desc: "Developer-first error tracking and performance monitoring", url: "https://github.com/getsentry/sentry", lang: "Python", topics: ["monitoring","error","tracking"] },
  
  // ============ 自动化/工作流类 ============
  { name: "airflow", stars: 45559, desc: "Programmatically author, schedule, and monitor workflows", url: "https://github.com/apache/airflow", lang: "Python", topics: ["workflow","automation","scheduler"] },
  { name: "pathway", stars: 63197, desc: "Python ETL framework for stream processing, real-time analytics, LLM pipelines", url: "https://github.com/pathwaycom/pathway", lang: "Python", topics: ["etl","streaming","llm","pipeline"] },
];

// ============================================
// 懒人服务评分函数
// ============================================

function scoreLazyService(project) {
  const text = `${project.name} ${project.desc} ${project.topics.join(' ')}`.toLowerCase();
  
  let score = 0;
  
  // 1. GitHub Stars (0-30分)
  if (project.stars > 100000) score += 30;
  else if (project.stars > 50000) score += 25;
  else if (project.stars > 20000) score += 20;
  else if (project.stars > 10000) score += 15;
  else if (project.stars > 5000) score += 10;
  else score += 5;
  
  // 2. CLI工具特征 (25分)
  if (/cli|command|script|runner|executor|tool|utility/i.test(text)) {
    score += 25;
  }
  
  // 3. 数据转换/处理能力 (25分)
  if (/converter|parser|transform|extract|scraper|crawl|scrape|parse|convert|extract/i.test(text)) {
    score += 25;
  }
  
  // 4. 自动化能力 (15分)
  if (/automation|workflow|pipeline|agent|monitor|tracking/i.test(text)) {
    score += 15;
  }
  
  // 5. API/服务化能力 (10分)
  if (/api|server|service|proxy|gateway|endpoint/i.test(text)) {
    score += 10;
  }
  
  // 6. 图片处理（非通用类型）(10分)
  if (/image|photo|picture|thumbnail|screenshot|capture|upscale|compress/i.test(text) && 
      !/video|voice|audio/i.test(text)) {
    score += 10;
  }
  
  // 7. 格式转换 (10分)
  if (/markdown|html|json|xml|yaml|csv/i.test(text)) {
    score += 10;
  }
  
  // 8. 浏览器自动化 (15分)
  if (/browser|headless|puppeteer|playwright|selenium|web/i.test(text)) {
    score += 15;
  }
  
  // ============ 减分项 ============
  
  // 排除太普遍的类型
  const excludedPatterns = [
    "whisper", "audio", "voice", "speech", "tts", "stt",
    "ffmpeg", "video", "transcribe",
    "chatgpt", "openai", "llm", "gpt-4", "llama",
    "pdf", // PDF处理太普遍
    "discord", "slack", "telegram", // 通讯工具
  ];
  
  if (excludedPatterns.some(p => text.includes(p))) {
    score = Math.floor(score * 0.3);
  }
  
  // 纯AI/模型项目减分
  if (/diffusion|stable.?diffusion|llm|training|gpt|model.*train/i.test(text) && 
      !/converter|parser|scraper|extract/i.test(text)) {
    score = Math.floor(score * 0.5);
  }
  
  // 太专业的开发工具减分
  if (/compiler|babel|webpack|parser.*code|ast/i.test(text) &&
      !/converter|parser.*web|scraper/i.test(text)) {
    score = Math.floor(score * 0.4);
  }
  
  // 监控/分析类项目减分（需要服务端部署）
  if (/monitoring|tracking.*server|analytics.*db/i.test(text) &&
      !/api|service|convert/i.test(text)) {
    score = Math.floor(score * 0.6);
  }
  
  return Math.max(0, Math.min(100, score));
}

// 预测懒人服务形态
function predictServiceType(project) {
  const text = `${project.name} ${project.desc} ${project.topics.join(' ')}`.toLowerCase();
  
  if (/crawler|scraper|crawl|scrape|web.*data/i.test(text)) {
    return "🌐 网页爬虫API";
  }
  if (/ocr|document|image.*text|text.*image/i.test(text)) {
    return "📄 文档识别API";
  }
  if (/screenshot|capture|page.*image/i.test(text)) {
    return "📸 网页截图API";
  }
  if (/converter|transform|markdown|html.*code|code.*html/i.test(text)) {
    return "🔄 格式转换API";
  }
  if (/image|photo|picture|thumbnail|upscale|compress|resize/i.test(text)) {
    return "🖼️ 图片处理API";
  }
  if (/face|swap|deepfake/i.test(text)) {
    return "🎭 AI换脸API";
  }
  if (/automation|workflow|pipeline|agent/i.test(text)) {
    return "⚡ 自动化API";
  }
  if (/trend|opinion|news|rss|monitor/i.test(text)) {
    return "📊 舆情监控API";
  }
  
  return "🔧 工具服务API";
}

// 生成变现建议
function generateMonetizationAdvice(project, serviceType) {
  const advice = {
    serviceType: serviceType,
    targetUsers: [],
    pricing: {},
    cost: 0,
    steps: [],
    competitiveAdvantage: ""
  };
  
  if (serviceType.includes("爬虫")) {
    advice.targetUsers = ["数据分析师", "市场研究人员", "竞品分析团队", "SEO从业者", "学术研究者"];
    advice.pricing = { "按页面": "$0.01-0.1", "包月": "$29-199", "企业定制": "$499+" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署firecrawl/scrapy开源爬虫框架",
      "2. 开发Web界面（上传URL→获取数据）",
      "3. 添加数据导出功能（JSON/CSV/Excel）",
      "4. 设置定价和支付",
      "5. 推广到数据需求社区"
    ];
    advice.competitiveAdvantage = "用户无需自己写爬虫代码，直接使用可视化界面完成任务";
  }
  else if (serviceType.includes("文档识别")) {
    advice.targetUsers = ["办公人群", "档案管理人员", "律师", "会计", "研究人员"];
    advice.pricing = { "按页": "$0.01-0.05", "包月": "$19-99", "批量处理": "$99+" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署PaddleOCR开源OCR引擎",
      "2. 开发图片/PDF上传界面",
      "3. 添加结构化输出（JSON/Excel）",
      "4. 支持批量处理",
      "5. 对接企业客户"
    ];
    advice.competitiveAdvantage = "开源OCR完全免费，你的服务让用户零门槛使用";
  }
  else if (serviceType.includes("截图")) {
    advice.targetUsers = ["设计师", "开发者", "内容创作者", "营销人员"];
    advice.pricing = { "按截图": "$0.05-0.2", "包月": "$19-49", "API调用": "$0.01/次" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署puppeteer/playwright截图服务",
      "2. 支持自定义分辨率、设备模拟",
      "3. 添加特效和标注功能",
      "4. 提供API接口",
      "5. 集成到设计工具"
    ];
    advice.competitiveAdvantage = "用户只需输入URL，即可获得完美截图，无需配置浏览器环境";
  }
  else if (serviceType.includes("格式转换")) {
    advice.targetUsers = ["开发者", "内容创作者", "技术写手", "网站管理员"];
    advice.pricing = { "按转换": "$0.001-0.01", "包月": "$9-39", "API": "$0.001/次" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署pandoc/marked转换服务",
      "2. 开发拖拽上传界面",
      "3. 支持批量转换",
      "4. 提供API接口",
      "5. 针对开发者推广"
    ];
    advice.competitiveAdvantage = "支持上百种格式转换，一站式解决文档转换需求";
  }
  else if (serviceType.includes("图片处理")) {
    advice.targetUsers = ["电商卖家", "设计师", "摄影师", "社交媒体运营"];
    advice.pricing = { "按图片": "$0.05-0.5", "包月": "$29-99", "批量": "$99+" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署upscayl/Real-ESRGAN图片处理服务",
      "2. 开发一键处理界面",
      "3. 支持批量处理",
      "4. 添加水印和压缩功能",
      "5. 对接电商平台"
    ];
    advice.competitiveAdvantage = "AI图片放大/增强完全免费，用户付费获得便捷使用体验";
  }
  else if (serviceType.includes("舆情")) {
    advice.targetUsers = ["品牌方", "营销团队", "投资人", "记者", "政府机构"];
    advice.pricing = { "按监控": "$29-99/月", "深度分析": "$199+/月", "定制": "$999+" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署TrendRadar舆情监控系统",
      "2. 配置关键词和平台源",
      "3. 开发仪表盘和报告功能",
      "4. 添加告警通知",
      "5. 对接企业客户"
    ];
    advice.competitiveAdvantage = "用户无需自己爬取和整理数据，直接获得舆情洞察";
  }
  else {
    advice.targetUsers = ["开发者", "小型企业", "个人用户"];
    advice.pricing = { "按次": "$0.01-0.1", "包月": "$19-99" };
    advice.cost = 0;
    advice.steps = [
      "1. 部署开源工具服务",
      "2. 开发简洁易用的Web界面",
      "3. 提供API接口",
      "4. 设置合理定价",
      "5. 精准推广"
    ];
    advice.competitiveAdvantage = "把复杂开源工具变成简单易用的在线服务";
  }
  
  return advice;
}

// ============================================
// 主程序
// ============================================

function main() {
  console.log("=" .repeat(100));
  console.log("🎯 懒人服务挖掘器 - GitHub开源项目 × 懒人服务变现分析报告");
  console.log("=" .repeat(100));
  console.log("\n📌 核心策略：把GitHub开源CLI工具翻译成懒人服务");
  console.log("📌 筛选标准：CLI工具 | 数据转换 | 自动化脚本 | API服务化");
  console.log("📌 排除类型：语音/视频/文档转换 | 通用AI/LLM | 通讯工具\n");
  
  // 计算每个项目的懒人服务评分
  const scoredProjects = GITHUB_PROJECTS.map(project => ({
    ...project,
    lazyScore: scoreLazyService(project),
    serviceType: predictServiceType(project)
  }));
  
  // 按懒人服务评分排序
  scoredProjects.sort((a, b) => b.lazyScore - a.lazyScore);
  
  // 过滤出评分 > 30的项目
  const topProjects = scoredProjects.filter(p => p.lazyScore > 30);
  
  console.log("=" .repeat(100));
  console.log(`🏆 TOP ${topProjects.length} 最适合做懒人服务的GitHub开源项目\n`);
  
  // 显示Top项目
  topProjects.forEach((project, i) => {
    console.log(`${i + 1}. ${project.name} ⭐${project.stars} | ${project.lang} | 懒人服务评分: ${project.lazyScore}/100`);
    console.log(`   📌 ${project.desc}`);
    console.log(`   🔮 懒人服务形态: ${project.serviceType}`);
    console.log(`   🔗 ${project.url}`);
    console.log("");
  });
  
  // 生成详细变现分析
  console.log("\n" + "=" .repeat(100));
  console.log("📋 懒人服务变现详细分析报告\n");
  
  topProjects.slice(0, 10).forEach((project, i) => {
    const advice = generateMonetizationAdvice(project, project.serviceType);
    
    console.log("-".repeat(80));
    console.log(`【项目 ${i + 1}: ${project.name}】`);
    console.log("-".repeat(80));
    console.log(`⭐ GitHub Stars: ${project.stars}`);
    console.log(`🔮 懒人服务形态: ${advice.serviceType}`);
    console.log(`📝 描述: ${project.desc}`);
    console.log(`🏷️ 技术栈: ${project.lang}`);
    console.log(`📊 懒人服务评分: ${project.lazyScore}/100`);
    console.log("");
    
    console.log("💰 变现建议:");
    console.log("   👥 目标用户:");
    advice.targetUsers.forEach(user => console.log(`      - ${user}`));
    console.log("");
    
    console.log("   💵 定价策略:");
    Object.entries(advice.pricing).forEach(([type, price]) => {
      console.log(`      - ${type}: ${price}`);
    });
    console.log("");
    
    console.log("   💵 成本: 接近$0（开源工具）");
    console.log("");
    
    console.log("   📋 实施步骤:");
    advice.steps.forEach(step => console.log(`      ${step}`));
    console.log("");
    
    console.log("   🏆 竞争优势:");
    console.log(`      ${advice.competitiveAdvantage}`);
    console.log("");
  });
  
  // 总结
  console.log("\n" + "=" .repeat(100));
  console.log("📊 懒人服务赛道总结\n");
  
  const categories = {};
  topProjects.forEach(p => {
    const cat = p.serviceType.split(' ')[0];
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p.name);
  });
  
  Object.entries(categories).forEach(([cat, names]) => {
    console.log(`   ${cat} 类: ${names.slice(0, 3).join(', ')}${names.length > 3 ? '...' : ''}`);
  });
  
  console.log("\n💡 核心洞察:");
  console.log("   1. 网页爬虫类工具需求旺盛，适合做数据服务API");
  console.log("   2. 图片处理工具（放大/压缩）电商需求大");
  console.log("   3. 文档识别（OCR）办公场景刚需");
  console.log("   4. 舆情监控企业付费意愿强");
  console.log("   5. 所有工具成本为$0，壁垒是用户体验和信息差");
  console.log("");
  
  console.log("=" .repeat(100));
  console.log("📝 行动计划建议:\n");
  console.log("   1. 选择1-2个最感兴趣的赛道");
  console.log("   2. 用开源工具部署Demo");
  console.log("   3. 开发简洁易用的Web界面");
  console.log("   4. 设定合理定价（按次 > 订阅）");
  console.log("   5. 在目标社区推广（Reddit、Twitter、垂直论坛）");
  console.log("=" .repeat(100));
}

// 运行
main();
