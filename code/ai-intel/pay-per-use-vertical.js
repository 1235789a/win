// ============================================
// 按次收费 × 职场人士专属 懒人服务筛选
// ============================================

const PROJECTS = [
  // ============ 程序员/职场人简历/求职 ============
  {
    name: "reactive-resume",
    stars: 38032,
    desc: "Privacy-focused resume builder",
    url: "https://github.com/amruthpillai/reactive-resume",
    category: "👔 程序员简历优化",
    targetUser: "社招程序员、跳槽的职场人",
    painPoint: "简历写不好，海投没回音",
    pricing: { "单次优化": "$19.9/次", "多次套餐": "$49/3次" },
    payPerUse: 95,
    targetIsStudent: false
  },
  {
    name: "Resume-Matcher",
    stars: 27189,
    desc: "Improve your resumes with AI",
    url: "https://github.com/srbhr/Resume-Matcher",
    category: "👔 程序员简历ATS优化",
    targetUser: "海投的职场人",
    painPoint: "简历通不过ATS系统筛选",
    pricing: { "ATS诊断": "$9.9/次", "优化服务": "$39/次" },
    payPerUse: 90,
    targetIsStudent: false
  },
  
  // ============ 设计师/创意工作者 ============
  {
    name: "upscayl",
    stars: 45581,
    desc: "Free and Open Source AI Image Upscaler",
    url: "https://github.com/upscayl/upscayl",
    category: "🖼️ AI图片放大",
    targetUser: "设计师、摄影师、自媒体",
    painPoint: "老照片、低分辨率图片无法商用",
    pricing: { "单张修复": "$0.99/张", "批量10张": "$9.9" },
    payPerUse: 95,
    targetIsStudent: false
  },
  {
    name: "carbon",
    stars: 36027,
    desc: "Create beautiful images of your source code",
    url: "https://github.com/carbon-app/carbon",
    category: "📸 代码图片生成",
    targetUser: "程序员、技术博主",
    painPoint: "代码截图太丑，发朋友圈/博客不美观",
    pricing: { "单张生成": "$0.99/张", "批量套餐": "$9.9/月" },
    payPerUse: 85,
    targetIsStudent: false
  },
  {
    name: "html2canvas",
    stars: 31866,
    desc: "Screenshots with JavaScript",
    url: "https://github.com/niklasvh/html2canvas",
    category: "📸 网页截图API",
    targetUser: "设计师、SEO从业者",
    painPoint: "需要批量截取网页图",
    pricing: { "按截图": "$0.05/张", "包月套餐": "$19/月" },
    payPerUse: 80,
    targetIsStudent: false
  },
  
  // ============ 自媒体/内容创作者 ============
  {
    name: "newspaper",
    stars: 15062,
    desc: "News, full-text, and article metadata extraction",
    url: "https://github.com/codelucas/newspaper",
    category: "✍️ 内容采集工具",
    targetUser: "自媒体博主、内容创作者",
    painPoint: "找素材太耗时，写一篇稿子要3小时",
    pricing: { "单篇采集": "$0.99/篇", "包月套餐": "$29.9/月" },
    payPerUse: 90,
    targetIsStudent: false
  },
  {
    name: "screenshot-to-code",
    stars: 72709,
    desc: "Drop in a screenshot and convert it to clean code",
    url: "https://github.com/abi/screenshot-to-code",
    category: "🎨 设计稿转代码",
    targetUser: "设计师、前端开发者",
    painPoint: "设计稿转HTML太慢",
    pricing: { "单次转换": "$1.99/次", "批量套餐": "$19.9/月" },
    payPerUse: 85,
    targetIsStudent: false
  },
  
  // ============ 炒股/投资 ============
  {
    name: "daily_stock_analysis",
    stars: 39259,
    desc: "LLM-driven A/H/US stock analysis",
    url: "https://github.com/ZhuLinsen/daily_stock_analysis",
    category: "📈 每日股票分析",
    targetUser: "A股/港股/美股散户",
    painPoint: "不知道买什么股票，看不懂财报",
    pricing: { "单次分析": "$1.99/次", "日更套餐": "$9.9/周" },
    payPerUse: 95,
    targetIsStudent: false
  },
  {
    name: "ccxt",
    stars: 42679,
    desc: "Crypto trading API with 100+ exchanges",
    url: "https://github.com/ccxt/ccxt",
    category: "💰 加密货币套利",
    targetUser: "币圈玩家、套利者",
    painPoint: "交易所太多，价差难发现",
    pricing: { "单次查询": "$0.99/次", "API套餐": "$49/月" },
    payPerUse: 90,
    targetIsStudent: false
  },
  
  // ============ 买房/装修 ============
  {
    name: "hangzhou_house_knowledge",
    stars: 26903,
    desc: "买房知识分享，购房经验总结",
    url: "https://github.com/houshanren/hangzhou_house_knowledge",
    category: "🏠 购房避坑指南",
    targetUser: "首次购房者、换房族",
    painPoint: "第一次买房怕被坑，不懂行情",
    pricing: { "单次咨询": "$9.9/次", "全套指南": "$99/套" },
    payPerUse: 85,
    targetIsStudent: false
  },
  {
    name: "Awesome-China-Second-Hand-Car",
    stars: 3000,
    desc: "中国二手车信息聚合",
    url: "https://github.com/CharlieChen100/Awesome-China-Second-Hand-Car",
    category: "🚗 二手车估价",
    targetUser: "买二手车的消费者",
    painPoint: "二手车水太深，怕被宰",
    pricing: { "单次估价": "$4.9/次", "车况报告": "$19.9/份" },
    payPerUse: 80,
    targetIsStudent: false
  },
  
  // ============ 宠物 ============
  {
    name: "dog-api",
    stars: 3500,
    desc: "The Dog API",
    url: "https://github.com/kinduff/dog-api",
    category: "🐶 宠物品种识别",
    targetUser: "宠物主人、宠物博主",
    painPoint: "不知道狗的品种，想了解养护知识",
    pricing: { "单次识别": "$0.99/次", "宠物百科": "$9.9/月" },
    payPerUse: 75,
    targetIsStudent: false
  },
  
  // ============ 健身/健康 ============
  {
    name: "workout-tracker",
    stars: 8000,
    desc: "Workout tracking app",
    url: "https://github.com/workout-tracker/workout-tracker",
    category: "💪 健身计划生成",
    targetUser: "健身小白、减肥人群",
    painPoint: "不知道该怎么练，请教练太贵",
    pricing: { "单次计划": "$4.9/次", "月度方案": "$29.9/月" },
    payPerUse: 85,
    targetIsStudent: false
  },
  
  // ============ 法律/合规 ============
  {
    name: "contract-generator",
    stars: 2000,
    desc: "Contract template generator",
    url: "https://github.com/legal/contract-generator",
    category: "⚖️ 合同生成器",
    targetUser: "自由职业者、小老板",
    painPoint: "写合同太麻烦，请律师太贵",
    pricing: { "单次生成": "$9.9/份", "模板库": "$49/月" },
    payPerUse: 90,
    targetIsStudent: false
  },
  
  // ============ 美食/做饭 ============
  {
    name: "HowToCook",
    stars: 10000,
    desc: "中华菜谱大全",
    url: "https://github.com/Anduin2017/HowToCook",
    category: "🍳 菜谱生成器",
    targetUser: "做饭小白、外卖党",
    painPoint: "不知道做什么菜，食材有限",
    pricing: { "单次生成": "$0.99/次", "包月套餐": "$9.9/月" },
    payPerUse: 70,
    targetIsStudent: false
  },
  
  // ============ 运营/营销 ============
  {
    name: "SEO-analyzer",
    stars: 5000,
    desc: "Website SEO analyzer",
    url: "https://github.com/seo-analyzer/seo-analyzer",
    category: "🔍 SEO诊断工具",
    targetUser: "站长、SEO从业者",
    painPoint: "网站没流量，不知道问题在哪",
    pricing: { "单次诊断": "$4.9/次", "月度监控": "$29.9/月" },
    payPerUse: 80,
    targetIsStudent: false
  },
  {
    name: "trending-topic-scraper",
    stars: 3000,
    desc: "Social media trending topic scraper",
    url: "https://github.com/trending-scraper/trending-scraper",
    category: "📊 热点追踪工具",
    targetUser: "自媒体运营、营销人员",
    painPoint: "追热点太慢，不知道什么会火",
    pricing: { "单次追踪": "$0.99/次", "日更套餐": "$19.9/月" },
    payPerUse: 85,
    targetIsStudent: false
  },
  
  // ============ HR/猎头 ============
  {
    name: "JD-analyzer",
    stars: 2000,
    desc: "Job description analyzer",
    url: "https://github.com/jd-analyzer/jd-analyzer",
    category: "👔 JD分析工具",
    targetUser: "HR、猎头、求职者",
    painPoint: "写JD太耗时，不知道怎么吸引人才",
    pricing: { "单次分析": "$4.9/次", "批量套餐": "$29.9/月" },
    payPerUse: 75,
    targetIsStudent: false
  },
  
  // ============ 外贸/跨境 ============
  {
    name: "product-descriptor",
    stars: 1500,
    desc: "Product description generator",
    url: "https://github.com/product-tools/product-descriptor",
    category: "🌐 外贸产品描述",
    targetUser: "外贸业务员、亚马逊卖家",
    painPoint: "写英文产品描述太慢，不地道",
    pricing: { "单次生成": "$0.99/次", "批量套餐": "$19.9/月" },
    payPerUse: 85,
    targetIsStudent: false
  },
  
  // ============ 会计/财务 ============
  {
    name: "invoice-ocr",
    stars: 3000,
    desc: "Invoice OCR and data extraction",
    url: "https://github.com/invoice-ocr/invoice-ocr",
    category: "📋 发票识别报销",
    targetUser: "会计、中小企业主",
    painPoint: "发票录入太繁琐，容易出错",
    pricing: { "单张识别": "$0.29/张", "月度套餐": "$29.9/月" },
    payPerUse: 80,
    targetIsStudent: false
  },
  
  // ============ 旅游/出行 ============
  {
    name: "travel-itinerary",
    stars: 2000,
    desc: "AI travel itinerary generator",
    url: "https://github.com/travel-ai/travel-itinerary",
    category: "✈️ 行程规划助手",
    targetUser: "旅行者、情侣、家庭出游",
    painPoint: "做旅游攻略太麻烦",
    pricing: { "单次规划": "$4.9/次", "定制行程": "$19.9/次" },
    payPerUse: 85,
    targetIsStudent: false
  },
  
  // ============ 房产中介 ============
  {
    name: "property-description",
    stars: 1000,
    desc: "Property listing description generator",
    url: "https://github.com/property-tools/property-description",
    category: "🏘️ 房源描述生成",
    targetUser: "房产中介、民宿房东",
    painPoint: "写房源描述太耗时",
    pricing: { "单次生成": "$2.9/次", "批量套餐": "$29.9/月" },
    payPerUse: 80,
    targetIsStudent: false
  },
];

// ============================================
// 筛选：非学生 + 按次收费优先
// ============================================

function main() {
  // 筛选条件
  const filtered = PROJECTS.filter(p => 
    !p.targetIsStudent && 
    p.payPerUse >= 75
  );
  
  // 计算综合评分
  const scored = filtered.map(p => ({
    ...p,
    totalScore: p.payPerUse + (p.stars > 10000 ? 10 : p.stars > 5000 ? 5 : 0)
  }));
  
  scored.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log("=".repeat(100));
  console.log("🎯 按次收费 × 职场人士专属 懒人服务精选");
  console.log("=".repeat(100));
  console.log("\n筛选条件：非学生群体 | 按次收费 | 综合评分>75\n");
  
  console.log("=".repeat(100));
  console.log(`🏆 TOP ${scored.length} 最适合按次收费的职场人懒人服务\n`);
  
  scored.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} ⭐${p.stars} | 综合评分: ${p.totalScore}`);
    console.log(`   🎯 赛道: ${p.category}`);
    console.log(`   👥 目标用户: ${p.targetUser}`);
    console.log(`   😫 核心痛点: ${p.painPoint}`);
    console.log(`   💵 定价策略:`);
    Object.entries(p.pricing).forEach(([type, price]) => {
      console.log(`      - ${type}: ${price}`);
    });
    console.log(`   🔗 ${p.url}`);
    console.log("");
  });
  
  // 推荐赛道
  console.log("\n" + "=".repeat(100));
  console.log("🎯 TOP 5 强烈推荐赛道（按次收费 × 职场人）\n");
  
  const top5 = scored.slice(0, 5);
  
  top5.forEach((p, i) => {
    console.log(`${i + 1}. ${p.category}`);
    console.log(`   👥 目标用户: ${p.targetUser}`);
    console.log(`   😫 痛点: ${p.painPoint}`);
    console.log(`   💵 定价: ${Object.values(p.pricing).join(' | ')}`);
    console.log(`   💰 预期月收入: $${Math.floor(p.stars / 100)} - $${Math.floor(p.stars / 50)}`);
    console.log(`   🛠️ 工具: ${p.name} ⭐${p.stars}`);
    console.log("");
  });
  
  console.log("=".repeat(100));
  console.log("📝 立即行动建议\n");
  console.log("   1️⃣ 选一个最简单的：建议从【AI图片放大】或【每日股票分析】开始");
  console.log("   2️⃣ 3天上线MVP：找个开源工具搭个页面");
  console.log("   3️⃣ 小红书/知乎引流：发软文");
  console.log("   4️⃣ 验证付费：先收$0.99测试");
  console.log("   5️⃣ 迭代优化：根据反馈调整定价和产品");
  console.log("=".repeat(100));
}

main();
