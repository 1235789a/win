#!/usr/bin/env python3

# ============================================
# 懒人服务挖掘系统 - 面向USDT群体
# 使用我们之前的项目抓取逻辑
# ============================================

import subprocess
import json
import time

# ============================================
# 面向USDT支付群体的关键词
# ============================================

USDT_KEYWORDS = [
    # Web3/加密货币工具
    "blockchain scanner ethereum bsc",
    "crypto portfolio tracker",
    "nft floor price",
    "defi dashboard",
    "wallet tracker",
    "gas fee calculator",
    "smart contract explorer",
    "token transfer monitor",
    "dao voting tool",
    "liquidity tracker",
    
    # 数据分析工具
    "data visualization dashboard",
    "web analytics",
    "api analytics",
    "realtime analytics",
    "user analytics",
    "product analytics",
    "business intelligence",
    "data pipeline",
    "etl tool",
    "data warehouse",
    
    # 自动化工具
    "workflow automation",
    "task automation",
    "scheduled task",
    "webhook automation",
    "integration platform",
    "zapier alternative",
    "n8n alternative",
    
    # API/开发工具
    "api gateway",
    "api management",
    "api documentation",
    "api mock server",
    "postman alternative",
    "swagger openapi",
    "rest api generator",
    "graphql tools",
    
    # 爬虫/数据采集
    "web scraper api",
    "data extraction",
    "html parser",
    "crawler framework",
    "scrapy alternative",
    
    # 图像/媒体处理
    "image compression api",
    "video thumbnail generator",
    "image resize crop",
    "background removal",
    "ocr api",
    
    # 支付/电商
    "payment gateway",
    "invoice generator",
    "receipt scanner",
    "expense tracker",
    "billing system",
    
    # 社交媒体
    "social media analytics",
    "instagram api",
    "twitter analytics",
    "youtube data api",
    "tiktok scraper",
    
    # AI/机器学习
    "ai api service",
    "image classification api",
    "text summarization",
    "language translation api",
    "speech to text api",
]

# ============================================
# 懒人服务评分标准
# ============================================

def calculate_lazy_score(project):
    """计算懒人服务潜力评分"""
    score = 0
    stars = project.get("stargazers_count", 0)
    
    # Stars权重 (满分40)
    score += min(stars / 1000, 40)
    
    # API化潜力 (满分30)
    desc = (project.get("description") or "").lower()
    api_keywords = ["api", "rest", "graphql", "webhook", "service", "sdk"]
    for kw in api_keywords:
        if kw in desc:
            score += 6
    
    # Web化潜力 (满分20)
    web_keywords = ["web", "online", "cloud", "saas", "dashboard"]
    for kw in web_keywords:
        if kw in desc:
            score += 4
    
    # 商业化潜力 (满分10)
    biz_keywords = ["analytics", "tracker", "monitor", "payment", "billing"]
    for kw in biz_keywords:
        if kw in desc:
            score += 2
    
    return min(score, 100)

# ============================================
# GitHub API抓取
# ============================================

def fetch_github(keyword, min_stars=2000):
    query = f"{keyword} stars:>{min_stars}"
    try:
        cmd = [
            "curl", "-s", "--connect-timeout", "10",
            f"https://api.github.com/search/repositories?q={query.replace(' ', '+')}&sort=stars&order=desc&per_page=20"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if "items" in data:
                return data["items"]
    except Exception as e:
        print(f"  ⚠️ 错误: {e}")
    return []

# ============================================
# 主程序
# ============================================

def main():
    print("=" * 100)
    print("🎯 懒人服务挖掘系统 - 面向USDT群体")
    print("=" * 100)
    print(f"\n📊 共 {len(USDT_KEYWORDS)} 个关键词\n")
    
    all_results = []
    
    for i, keyword in enumerate(USDT_KEYWORDS, 1):
        print(f"[{i}/{len(USDT_KEYWORDS)}] 🔍 {keyword}")
        
        projects = fetch_github(keyword, 1000)
        
        if not projects:
            print("  ❌ 无结果")
            continue
        
        print(f"  ✅ 找到 {len(projects)} 个项目")
        
        for p in projects[:5]:  # 每个关键词取TOP 5
            # 计算懒人服务评分
            lazy_score = calculate_lazy_score(p)
            
            all_results.append({
                "keyword": keyword,
                "name": p["name"],
                "stars": p["stargazers_count"],
                "description": p.get("description", ""),
                "url": p["html_url"],
                "language": p.get("language", ""),
                "lazy_score": lazy_score,
                "lazy_reason": get_lazy_reason(p)
            })
        
        time.sleep(0.3)
    
    print("\n" + "=" * 100)
    print(f"\n🎉 共抓取到 {len(all_results)} 个候选项目\n")
    
    # 按懒人服务评分排序
    all_results.sort(key=lambda x: -x["lazy_score"])
    
    # 去重
    seen = set()
    unique_results = []
    for r in all_results:
        if r["name"] not in seen:
            seen.add(r["name"])
            unique_results.append(r)
    
    print(f"📦 去重后: {len(unique_results)} 个项目\n")
    
    # 输出TOP 30
    print("=" * 100)
    print("🏆 TOP 30 懒人服务候选项目（按懒人服务潜力排序）\n")
    
    for i, r in enumerate(unique_results[:30], 1):
        print(f"{i:2d}. {r['name']:<35} ⭐{r['stars']:<8} | 评分: {r['lazy_score']:.0f}/100")
        print(f"    📝 {r['description'][:70] if r['description'] else '无描述'}")
        print(f"    💡 懒人理由: {r['lazy_reason']}")
        print(f"    🔗 {r['url']}")
        print()
    
    # 按类别分组
    print("\n" + "=" * 100)
    print("📂 按类别分组\n")
    
    categories = {}
    for r in unique_results:
        kw = r["keyword"].split()[0]
        if kw not in categories:
            categories[kw] = []
        categories[kw].append(r)
    
    for cat, projects in sorted(categories.items(), key=lambda x: -sum(p["lazy_score"] for p in x[1])):
        total_score = sum(p["lazy_score"] for p in projects)
        print(f"\n🔸 {cat} ({len(projects)}个项目, 总评分{total_score:.0f})")
        for p in projects[:3]:
            print(f"   - {p['name']} ⭐{p['stars']} | 评分{p['lazy_score']:.0f}")
    
    # 保存结果
    with open("/workspace/code/ai-intel/lazy-service-usdt.json", "w", encoding="utf-8") as f:
        json.dump(unique_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n✅ 结果已保存到: /workspace/code/ai-intel/lazy-service-usdt.json")

def get_lazy_reason(project):
    """生成懒人服务理由"""
    desc = (project.get("description") or "").lower()
    name = project.get("name", "").lower()
    
    reasons = []
    
    if "api" in desc or "api" in name:
        reasons.append("可包装成API服务")
    
    if "dashboard" in desc or "dashboard" in name:
        reasons.append("可做Web仪表盘")
    
    if "tracker" in desc or "tracker" in name:
        reasons.append("可做监控追踪服务")
    
    if "analytics" in desc or "analytics" in name:
        reasons.append("可做数据分析服务")
    
    if "generator" in desc or "generator" in name:
        reasons.append("可做在线生成器")
    
    if "scraper" in desc or "scraper" in name or "crawl" in desc:
        reasons.append("可做数据采集服务")
    
    if "automation" in desc or "workflow" in desc:
        reasons.append("可做自动化服务")
    
    if "converter" in desc or "converter" in name:
        reasons.append("可做格式转换服务")
    
    if not reasons:
        reasons.append("技术成熟可Web化")
    
    return " + ".join(reasons[:2])

if __name__ == "__main__":
    main()
