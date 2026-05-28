// ============================================
// 垂直领域懒人服务挖掘器 v3.0
// ============================================

// 整合所有垂直领域的GitHub项目数据
const VERTICAL_PROJECTS = [
  // ============ 1. 电商/零售领域 ============
  { 
    name: "Douyin_TikTok_Download_API", 
    stars: 18065, 
    desc: "抖音、快手、TikTok、B站数据爬取工具，支持API调用",
    url: "https://github.com/Evil0ctal/Douyin_TikTok_Download_API", 
    lang: "Python", 
    category: "🛒 电商/社交媒体",
    niche: "短视频数据提取API",
    difficulty: "低"
  },
  { 
    name: "MediaCrawler", 
    stars: 50342, 
    desc: "小红书、抖音、快手、B站、微博爬虫",
    url: "https://github.com/NanmiCoder/MediaCrawler", 
    lang: "Python", 
    category: "🛒 电商/社交媒体",
    niche: "社交媒体内容监控",
    difficulty: "中"
  },
  
  // ============ 2. 金融投资领域 ============
  { 
    name: "OpenBB", 
    stars: 68203, 
    desc: "AI-oriented Quant investment platform",
    url: "https://github.com/OpenBB-finance/OpenBB", 
    lang: "Python", 
    category: "💰 金融投资",
    niche: "金融数据分析平台",
    difficulty: "高"
  },
  { 
    name: "TradingAgents", 
    stars: 80365, 
    desc: "Multi-Agents LLM Financial Trading Framework",
    url: "https://github.com/TauricResearch/TradingAgents", 
    lang: "Python", 
    category: "💰 金融投资",
    niche: "AI量化交易系统",
    difficulty: "高"
  },
  { 
    name: "daily_stock_analysis", 
    stars: 39259, 
    desc: "LLM驱动的 A/H/美股智能分析系统",
    url: "https://github.com/ZhuLinsen/daily_stock_analysis", 
    lang: "Python", 
    category: "💰 金融投资",
    niche: "股票分析报告生成",
    difficulty: "中"
  },
  { 
    name: "freqtrade", 
    stars: 50845, 
    desc: "Free, open source crypto trading bot",
    url: "https://github.com/freqtrade/freqtrade", 
    lang: "Python", 
    category: "💰 金融投资",
    niche: "加密货币交易机器人",
    difficulty: "中"
  },
  { 
    name: "ccxt", 
    stars: 42679, 
    desc: "Cryptocurrency trading API with 100+ exchanges",
    url: "https://github.com/ccxt/ccxt", 
    lang: "Python", 
    category: "💰 金融投资",
    niche: "加密货币交易所API",
    difficulty: "低"
  },
  { 
    name: "maybe-finance", 
    stars: 54143, 
    desc: "Personal finance app for everyone",
    url: "https://github.com/maybe-finance/maybe", 
    lang: "Ruby", 
    category: "💰 金融投资",
    niche: "个人财务管理",
    difficulty: "中"
  },
  
  // ============ 3. 医疗健康领域 ============
  { 
    name: "QASystemOnMedicalKG", 
    stars: 7288, 
    desc: "医学知识图谱自动问答系统",
    url: "https://github.com/liuhuanyong/QASystemOnMedicalKG", 
    lang: "Python", 
    category: "🏥 医疗健康",
    niche: "医疗知识库问答",
    difficulty: "高"
  },
  { 
    name: "MedicalGPT", 
    stars: 5443, 
    desc: "训练医疗大模型，实现医疗问答",
    url: "https://github.com/shibing624/MedicalGPT", 
    lang: "Python", 
    category: "🏥 医疗健康",
    niche: "医疗AI助手",
    difficulty: "高"
  },
  { 
    name: "Huatuo-Llama-Med-Chinese", 
    stars: 4968, 
    desc: "基于中文医学知识的大语言模型",
    url: "https://github.com/SCIR-HI/Huatuo-Llama-Med-Chinese", 
    lang: "Python", 
    category: "🏥 医疗健康",
    niche: "中文医疗LLM",
    difficulty: "高"
  },
  { 
    name: "MONAI", 
    stars: 8204, 
    desc: "AI Toolkit for Healthcare Imaging",
    url: "https://github.com/Project-MONAI/MONAI", 
    lang: "Python", 
    category: "🏥 医疗健康",
    niche: "医疗影像AI",
    difficulty: "高"
  },
  { 
    name: "MedSAM", 
    stars: 4282, 
    desc: "Segment Anything in Medical Images",
    url: "https://github.com/bowang-lab/MedSAM", 
    lang: "Jupyter", 
    category: "🏥 医疗健康",
    niche: "医学图像分割",
    difficulty: "高"
  },
  { 
    name: "openemr", 
    stars: 5176, 
    desc: "Open source electronic health records",
    url: "https://github.com/openemr/openemr", 
    lang: "PHP", 
    category: "🏥 医疗健康",
    niche: "电子病历系统",
    difficulty: "高"
  },
  
  // ============ 4. 招聘/简历领域 ============
  { 
    name: "Resume-Matcher", 
    stars: 27189, 
    desc: "Improve your resumes with AI. Get insights, keyword suggestions",
    url: "https://github.com/srbhr/Resume-Matcher", 
    lang: "TypeScript", 
    category: "👔 招聘/简历",
    niche: "简历优化AI",
    difficulty: "中"
  },
  { 
    name: "Jobs_Applier_AI_Agent_AIHawk", 
    stars: 29823, 
    desc: "AI自动求职申请代理，自动投递简历",
    url: "https://github.com/feder-cr/Jobs_Applier_AI_Agent_AIHawk", 
    lang: "Python", 
    category: "👔 招聘/简历",
    niche: "自动求职申请",
    difficulty: "中"
  },
  { 
    name: "reactive-resume", 
    stars: 38032, 
    desc: "Privacy-focused resume builder, open source forever",
    url: "https://github.com/amruthpillai/reactive-resume", 
    lang: "TypeScript", 
    category: "👔 招聘/简历",
    niche: "在线简历生成器",
    difficulty: "低"
  },
  { 
    name: "career-ops", 
    stars: 47632, 
    desc: "AI-powered job search system built on Claude Code",
    url: "https://github.com/santifer/career-ops", 
    lang: "JavaScript", 
    category: "👔 招聘/简历",
    niche: "AI求职助手",
    difficulty: "中"
  },
  
  // ============ 5. 教育学习领域 ============
  { 
    name: "hello-algo", 
    stars: 126442, 
    desc: "《Hello 算法》：动画图解、一键运行的数据结构与算法教程",
    url: "https://github.com/krahets/hello-algo", 
    lang: "Java", 
    category: "📚 教育学习",
    niche: "算法可视化教学",
    difficulty: "低"
  },
  { 
    name: "llm-course", 
    stars: 79695, 
    desc: "Course to get into Large Language Models",
    url: "https://github.com/mlabonne/llm-course", 
    lang: "null", 
    category: "📚 教育学习",
    niche: "LLM学习路线",
    difficulty: "低"
  },
  { 
    name: "ML-For-Beginners", 
    stars: 86008, 
    desc: "12 weeks, 26 lessons, classic Machine Learning",
    url: "https://github.com/microsoft/ML-For-Beginners", 
    lang: "Jupyter", 
    category: "📚 教育学习",
    niche: "机器学习教程",
    difficulty: "低"
  },
  
  // ============ 6. 内容创作/博客领域 ============
  { 
    name: "Ghost", 
    stars: 53719, 
    desc: "Independent technology for publishing, memberships, newsletters",
    url: "https://github.com/TryGhost/Ghost", 
    lang: "JavaScript", 
    category: "✍️ 内容创作",
    niche: "专业博客平台",
    difficulty: "中"
  },
  { 
    name: "halo", 
    stars: 38799, 
    desc: "强大易用的开源建站工具，支持博客、知识库、企业官网",
    url: "https://github.com/halo-dev/halo", 
    lang: "Java", 
    category: "✍️ 内容创作",
    niche: "一站式建站工具",
    difficulty: "中"
  },
  { 
    name: "AppFlowy", 
    stars: 71391, 
    desc: "AI collaborative workspace, Notion alternative",
    url: "https://github.com/AppFlowy-IO/AppFlowy", 
    lang: "Dart", 
    category: "✍️ 内容创作",
    niche: "AI协作文档",
    difficulty: "高"
  },
  { 
    name: "newspaper", 
    stars: 15062, 
    desc: "News, full-text, and article metadata extraction in Python",
    url: "https://github.com/codelucas/newspaper", 
    lang: "Python", 
    category: "✍️ 内容创作",
    niche: "新闻内容提取",
    difficulty: "极低"
  },
  
  // ============ 7. 社交媒体分析领域 ============
  { 
    name: "snscrape", 
    stars: 5373, 
    desc: "Social networking service scraper in Python",
    url: "https://github.com/JustAnotherArchivist/snscrape", 
    lang: "Python", 
    category: "📱 社交媒体",
    niche: "社交媒体爬虫",
    difficulty: "低"
  },
  { 
    name: "deer-flow", 
    stars: 69865, 
    desc: "SuperAgent harness that researches, codes, and creates",
    url: "https://github.com/bytedance/deer-flow", 
    lang: "Python", 
    category: "📱 社交媒体",
    niche: "AI研究助手",
    difficulty: "中"
  },
  
  // ============ 8. 酒店/旅游领域 ============
  { 
    name: "QloApps", 
    stars: 13280, 
    desc: "Free hotel management and reservation system",
    url: "https://github.com/Qloapps/QloApps", 
    lang: "PHP", 
    category: "🏨 酒店旅游",
    niche: "酒店管理系统",
    difficulty: "中"
  },
  
  // ============ 9. 房地产领域 ============
  { 
    name: "hangzhou_house_knowledge", 
    stars: 26903, 
    desc: "买房知识分享，购房经验总结",
    url: "https://github.com/houshanren/hangzhou_house_knowledge", 
    lang: "CSS", 
    category: "🏠 房地产",
    niche: "购房知识库",
    difficulty: "低"
  },
];

// ============================================
// 垂直领域懒人服务评分
// ============================================

function scoreVerticalLazyService(project) {
  const text = `${project.name} ${project.desc} ${project.niche} ${project.category}`.toLowerCase();
  
  let score = 0;
  
  // 1. GitHub Stars (0-25分)
  if (project.stars > 100000) score += 25;
  else if (project.stars > 50000) score += 20;
  else if (project.stars > 20000) score += 15;
  else if (project.stars > 10000) score += 10;
  else if (project.stars > 5000) score += 5;
  else score += 3;
  
  // 2. 垂直领域明确 (20分)
  if (project.niche && project.niche.length > 3) {
    score += 20;
  }
  
  // 3. 易于Web化/API化 (15分)
  if (project.difficulty === "极低" || project.difficulty === "低") {
    score += 15;
  } else if (project.difficulty === "中") {
    score += 10;
  }
  
  // 4. 有明确付费场景 (20分)
  const commercialPatterns = [
    "api", "saas", "platform", "service", "tool",
    "trading", "finance", "stock", "crypto", "investment",
    "medical", "health", "doctor", "patient",
    "resume", "job", "hiring", "recruit",
    "crm", "erp", "management", "system",
    "analytics", "insight", "report", "dashboard",
    "content", "creator", "blog", "publish"
  ];
  
  if (commercialPatterns.some(p => text.includes(p))) {
    score += 20;
  }
  
  // 5. B2B潜在客户 (10分)
  if (/business|enterprise|company|team|organization/i.test(text)) {
    score += 10;
  }
  
  // 6. C端用户广泛 (5分)
  if (/personal|individual|user|consumer/i.test(text)) {
    score += 5;
  }
  
  return Math.min(100, score);
}

// 生成垂直领域变现建议
function generateVerticalMonetizationAdvice(project) {
  const advice = {
    serviceType: project.niche,
    targetUsers: [],
    pricing: {},
    cost: 0,
    difficulty: project.difficulty,
    advantage: "",
    monetizationModel: ""
  };
  
  // 根据垂直领域定制变现建议
  if (project.category.includes("金融")) {
    advice.targetUsers = ["个人投资者", "散户", "量化交易者", "小型基金"];
    advice.pricing = { 
      "个人版": "$29-99/月", 
      "专业版": "$199-499/月", 
      "API接口": "$0.01-0.1/次",
      "企业定制": "$999+/月"
    };
    advice.advantage = "AI驱动的金融分析，用户无需自己编写量化策略";
    advice.monetizationModel = "订阅制 + API调用 + 增值服务";
  }
  else if (project.category.includes("医疗")) {
    advice.targetUsers = ["患者", "医生", "医院", "医疗AI公司"];
    advice.pricing = { 
      "个人健康咨询": "$9-29/月", 
      "医生辅助工具": "$99-299/月", 
      "医院API": "$499+/月",
      "企业定制": "$1999+/月"
    };
    advice.advantage = "医疗AI助手，辅助诊断和健康咨询";
    advice.monetizationModel = "订阅制 + 医院采购 + API授权";
  }
  else if (project.category.includes("招聘")) {
    advice.targetUsers = ["求职者", "HR", "猎头", "招聘平台"];
    advice.pricing = { 
      "简历优化": "$9.9/份", 
      "求职助手月卡": "$29-99/月", 
      "企业招聘系统": "$199-499/月",
      "批量处理": "$99+/月"
    };
    advice.advantage = "AI简历优化和自动求职申请，省时省力";
    advice.monetizationModel = "按次收费 + 订阅制 + 企业版";
  }
  else if (project.category.includes("教育")) {
    advice.targetUsers = ["学生", "开发者", "转行者", "终身学习者"];
    advice.pricing = { 
      "课程订阅": "$9-49/月", 
      "一对一辅导": "$29-99/小时", 
      "企业培训": "$999+/月",
      "证书认证": "$99-299/个"
    };
    advice.advantage = "可视化学习工具，让复杂概念简单易懂";
    advice.monetizationModel = "订阅制 + 增值服务 + 企业合作";
  }
  else if (project.category.includes("内容创作")) {
    advice.targetUsers = ["博主", "自媒体", "内容创作者", "小型媒体"];
    advice.pricing = { 
      "基础版": "$9-29/月", 
      "专业版": "$49-99/月", 
      "团队版": "$199+/月",
      "按篇收费": "$0.5-2/篇"
    };
    advice.advantage = "一站式内容管理和发布平台，简化工作流";
    advice.monetizationModel = "订阅制 + 增值服务 + 模板市场";
  }
  else if (project.category.includes("电商") || project.category.includes("社交媒体")) {
    advice.targetUsers = ["网红", "MCN机构", "品牌方", "市场研究人员"];
    advice.pricing = { 
      "数据监控": "$29-99/月", 
      "数据分析": "$99-299/月", 
      "API接口": "$0.01-0.1/次",
      "企业定制": "$499+/月"
    };
    advice.advantage = "短视频数据分析，洞察内容和用户趋势";
    advice.monetizationModel = "订阅制 + API调用 + 数据报告";
  }
  else if (project.category.includes("酒店")) {
    advice.targetUsers = ["酒店", "民宿", "小型旅馆", "旅游平台"];
    advice.pricing = { 
      "基础版": "$29-99/月", 
      "专业版": "$199-499/月", 
      "企业定制": "$999+/月",
      "OTA对接": "$99+/月"
    };
    advice.advantage = "开源酒店管理系统，降低IT成本";
    advice.monetizationModel = "SaaS订阅 + 实施服务 + 定制开发";
  }
  else {
    advice.targetUsers = ["个人用户", "小型企业", "专业用户"];
    advice.pricing = { 
      "免费版": "基础功能", 
      "专业版": "$9-49/月", 
      "企业版": "$99+/月"
    };
    advice.advantage = "垂直领域的专业化工具";
    advice.monetizationModel = "Freemium + 订阅制";
  }
  
  return advice;
}

// ============================================
// 主程序
// ============================================

function main() {
  console.log("=" .repeat(100));
  console.log("🎯 垂直领域懒人服务挖掘器 v3.0");
  console.log("=" .repeat(100));
  console.log("\n📌 核心策略：针对特定行业的深度垂直解决方案");
  console.log("📌 筛选标准：垂直领域 | 明确付费场景 | 易于API化\n");
  
  // 计算每个项目的懒人服务评分
  const scoredProjects = VERTICAL_PROJECTS.map(project => ({
    ...project,
    lazyScore: scoreVerticalLazyService(project)
  }));
  
  // 按懒人服务评分排序
  scoredProjects.sort((a, b) => b.lazyScore - a.lazyScore);
  
  console.log("=" .repeat(100));
  console.log(`🏆 TOP ${scoredProjects.length} 最适合做垂直领域懒人服务的GitHub开源项目\n`);
  
  // 显示Top项目
  scoredProjects.slice(0, 20).forEach((project, i) => {
    const diff_emoji = project.difficulty === "极低" ? "🟢" : 
                       project.difficulty === "低" ? "🟢" :
                       project.difficulty === "中" ? "🟡" : "🔴";
    
    console.log(`${i + 1}. ${project.name} ⭐${project.stars} | ${diff_emoji}${project.difficulty} | 评分: ${project.lazyScore}`);
    console.log(`   📌 ${project.desc}`);
    console.log(`   🎯 垂直领域: ${project.category}`);
    console.log(`   🔮 细分赛道: ${project.niche}`);
    console.log(`   🔗 ${project.url}`);
    console.log("");
  });
  
  // 按垂直领域分类
  console.log("\n" + "=" .repeat(100));
  console.log("📊 垂直领域赛道分类\n");
  
  const categories = {};
  scoredProjects.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push({
      name: p.name,
      stars: p.stars,
      score: p.lazyScore,
      niche: p.niche,
      difficulty: p.difficulty
    });
  });
  
  Object.entries(categories).forEach(([cat, projects]) => {
    const avgScore = Math.round(projects.reduce((sum, p) => sum + p.score, 0) / projects.length);
    const totalStars = projects.reduce((sum, p) => sum + p.stars, 0);
    
    console.log(`${cat} (${projects.length}个项目, 平均评分: ${avgScore}, 总Stars: ${totalStars.toLocaleString()})`);
    projects.sort((a, b) => b.stars - a.stars).slice(0, 3).forEach(p => {
      console.log(`   • ${p.name} ⭐${p.stars} | ${p.niche} [${p.difficulty}]`);
    });
    console.log("");
  });
  
  // 详细变现分析
  console.log("\n" + "=" .repeat(100));
  console.log("💰 垂直领域懒人服务变现详细分析\n");
  
  // 精选10个最有潜力的项目
  const topProjects = scoredProjects.filter(p => p.lazyScore > 30).slice(0, 10);
  
  topProjects.forEach((project, i) => {
    const advice = generateVerticalMonetizationAdvice(project);
    
    console.log("-".repeat(80));
    console.log(`【项目 ${i + 1}: ${project.name}】`);
    console.log("-".repeat(80));
    console.log(`⭐ GitHub Stars: ${project.stars}`);
    console.log(`🎯 垂直领域: ${project.category}`);
    console.log(`🔮 细分赛道: ${project.niche}`);
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
    console.log(`   📈 变现模式: ${advice.monetizationModel}`);
    console.log("");
    
    console.log("   🏆 竞争优势:");
    console.log(`      ${advice.advantage}`);
    console.log("");
  });
  
  // 推荐赛道
  console.log("\n" + "=" .repeat(100));
  console.log("🎯 垂直领域懒人服务赛道推荐\n");
  
  const recommendations = [
    {
      category: "💰 金融投资",
      reason: "用户付费意愿极强，量化交易市场需求大",
      examples: ["OpenBB", "TradingAgents", "daily_stock_analysis"],
      revenue: "$5000-50000/月",
      barrier: "技术门槛较高，需要金融背景"
    },
    {
      category: "👔 招聘/简历",
      reason: "求职市场庞大，AI简历优化需求旺盛",
      examples: ["Resume-Matcher", "AIHawk", "career-ops"],
      revenue: "$1000-10000/月",
      barrier: "竞争激烈，需要差异化"
    },
    {
      category: "📱 社交媒体数据",
      reason: "MCN机构和品牌方愿为数据付费",
      examples: ["MediaCrawler", "snscrape"],
      revenue: "$2000-20000/月",
      barrier: "平台API政策风险"
    },
    {
      category: "🏥 医疗健康",
      reason: "医疗AI助手需求大，但需合规",
      examples: ["MedicalGPT", "QASystemOnMedicalKG"],
      revenue: "$5000-50000/月",
      barrier: "监管严格，数据隐私要求高"
    },
    {
      category: "📚 教育学习",
      reason: "学习平台用户基数大，变现路径清晰",
      examples: ["hello-algo", "llm-course"],
      revenue: "$1000-10000/月",
      barrier: "内容为王，制作成本高"
    },
    {
      category: "✍️ 内容创作",
      reason: "自媒体爆发，内容管理需求大",
      examples: ["Ghost", "halo", "AppFlowy"],
      revenue: "$1000-5000/月",
      barrier: "大厂竞争，需要垂直化"
    },
  ];
  
  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.category}`);
    console.log(`   💡 原因: ${rec.reason}`);
    console.log(`   🛠️ 典型项目: ${rec.examples.join(', ')}`);
    console.log(`   💰 预期月收入: ${rec.revenue}`);
    console.log(`   ⚠️ 壁垒: ${rec.barrier}`);
    console.log("");
  });
  
  // 行动计划
  console.log("=" .repeat(100));
  console.log("📝 垂直领域懒人服务行动计划\n");
  console.log("   1️⃣ 选择赛道：从TOP 6推荐中选择1个最感兴趣的垂直领域");
  console.log("   2️⃣ 市场调研：明确目标用户和痛点");
  console.log("   3️⃣ 快速MVP：用开源工具部署Demo，1周内上线");
  console.log("   4️⃣ 核心功能：聚焦1个核心功能做到极致");
  console.log("   5️⃣ 定价策略：按次/订阅混合， Freemium 引流");
  console.log("   6️⃣ 渠道推广：垂直社区 + SEO + KOL合作");
  console.log("=" .repeat(100));
}

// 运行
main();
