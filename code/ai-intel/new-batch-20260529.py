#!/usr/bin/env python3

# ============================================
# 懒人服务挖掘 - 2026-05-29 新批次
# ============================================

PROJECTS = [
    # ============ 第一类：CLI工具 ============
    {
        "name": "ohmyzsh",
        "stars": 187424,
        "desc": "A delightful community-driven framework for managing your zsh configuration.",
        "url": "https://github.com/ohmyzsh/ohmyzsh",
        "language": "Shell",
        "category": "CLI工具",
        "subcategory": "终端配置",
        "niche": "一键终端美化",
        "difficulty": "低",
        "target_user": "程序员、开发人员、终端用户",
        "pain_point": "终端太丑，配置太麻烦，插件太多不知道怎么选",
        "pricing": {
            "单套配置": "$4.9/套",
            "年度更新": "$9.9/年"
        },
        "lazy_score": 85
    },
    {
        "name": "shell_gpt",
        "stars": 12086,
        "desc": "A command-line productivity tool powered by AI large language models like GPT-5.",
        "url": "https://github.com/TheR1D/shell_gpt",
        "language": "Python",
        "category": "AI工具",
        "subcategory": "命令行AI",
        "niche": "自然语言转Shell命令",
        "difficulty": "中",
        "target_user": "程序员、运维、终端用户",
        "pain_point": "记不住命令参数，不知道怎么写复杂命令",
        "pricing": {
            "月卡": "$4.9/月",
            "API调用": "$0.01/次"
        },
        "lazy_score": 92
    },
    {
        "name": "navi",
        "stars": 17171,
        "desc": "An interactive cheatsheet tool for the command-line.",
        "url": "https://github.com/denisidoro/navi",
        "language": "Rust",
        "category": "CLI工具",
        "subcategory": "命令速查",
        "niche": "交互式命令速查表",
        "difficulty": "低",
        "target_user": "程序员、开发人员",
        "pain_point": "命令太多记不住，找文档太慢",
        "pricing": {
            "社区版": "免费",
            "专业版": "$4.9/月"
        },
        "lazy_score": 80
    },
    {
        "name": "grex",
        "stars": 8129,
        "desc": "A command-line tool for generating regular expressions from test cases.",
        "url": "https://github.com/pemistahl/grex",
        "language": "Rust",
        "category": "开发工具",
        "subcategory": "正则表达式",
        "niche": "AI正则表达式生成",
        "difficulty": "低",
        "target_user": "程序员、数据分析师",
        "pain_point": "写正则太痛苦，总是出错",
        "pricing": {
            "单次生成": "$0.99/次",
            "月卡": "$4.9/月"
        },
        "lazy_score": 88
    },
    {
        "name": "bandwhich",
        "stars": 11762,
        "desc": "Terminal bandwidth utilization tool.",
        "url": "https://github.com/imsnif/bandwhich",
        "language": "Rust",
        "category": "网络工具",
        "subcategory": "带宽监控",
        "niche": "网络带宽实时监控",
        "difficulty": "低",
        "target_user": "程序员、运维、网络管理员",
        "pain_point": "不知道哪个程序在占用带宽",
        "pricing": {
            "月卡": "$2.9/月"
        },
        "lazy_score": 75
    },
    {
        "name": "xh",
        "stars": 7836,
        "desc": "Friendly and fast tool for sending HTTP requests.",
        "url": "https://github.com/ducaale/xh",
        "language": "Rust",
        "category": "开发工具",
        "subcategory": "HTTP工具",
        "niche": "简单HTTP请求工具",
        "difficulty": "低",
        "target_user": "前端、后端开发、API测试",
        "pain_point": "curl命令太复杂，Postman太重",
        "pricing": {
            "基础版": "免费",
            "高级版": "$3.9/月"
        },
        "lazy_score": 78
    },
    {
        "name": "ascii-image-converter",
        "stars": 3347,
        "desc": "Convert images into ascii art.",
        "url": "https://github.com/TheZoraiz/ascii-image-converter",
        "language": "Go",
        "category": "创意工具",
        "subcategory": "ASCII艺术",
        "niche": "图片转ASCII艺术",
        "difficulty": "极低",
        "target_user": "创意人员、内容创作者",
        "pain_point": "想要酷炫的ASCII艺术但不会画",
        "pricing": {
            "单张转换": "$0.49/张",
            "批量套餐": "$4.9/10张"
        },
        "lazy_score": 82
    },
    # ============ 第二类：网络爬虫 ============
    {
        "name": "crawlee",
        "stars": 23543,
        "desc": "Web scraping and browser automation library for Node.js.",
        "url": "https://github.com/apify/crawlee",
        "language": "TypeScript",
        "category": "数据工具",
        "subcategory": "网页爬取",
        "niche": "无代码网页数据抓取",
        "difficulty": "中",
        "target_user": "数据分析师、市场研究人员、SEO",
        "pain_point": "不会写爬虫，需要从网页提取数据",
        "pricing": {
            "按页面": "$0.01/页",
            "月卡": "$29.9/月",
            "API": "$0.005/次"
        },
        "lazy_score": 94
    },
    {
        "name": "maxun",
        "stars": 15675,
        "desc": "Open-source no-code platform for web scraping and AI data extraction.",
        "url": "https://github.com/getmaxun/maxun",
        "language": "TypeScript",
        "category": "数据工具",
        "subcategory": "无代码爬虫",
        "niche": "可视化网页数据提取",
        "difficulty": "低",
        "target_user": "非技术人员、运营、市场",
        "pain_point": "不会写代码，需要提取网页数据",
        "pricing": {
            "月卡": "$19.9/月",
            "企业版": "$99.9/月"
        },
        "lazy_score": 91
    },
    # ============ 第三类：文档/内容 ============
    {
        "name": "presenterm",
        "stars": 8458,
        "desc": "A markdown terminal slideshow tool.",
        "url": "https://github.com/mfontanini/presenterm",
        "language": "Rust",
        "category": "内容工具",
        "subcategory": "演示文稿",
        "niche": "Markdown转演示文稿",
        "difficulty": "低",
        "target_user": "程序员、讲师、培训师",
        "pain_point": "写PPT太费劲，想要简单的演示工具",
        "pricing": {
            "单次生成": "$1.99/次",
            "模板库": "$9.9/月"
        },
        "lazy_score": 83
    },
    # ============ 第四类：AI/工具 ============
    {
        "name": "gptme",
        "stars": 4313,
        "desc": "Your agent in your terminal, writes code, uses the terminal, browses the web.",
        "url": "https://github.com/gptme/gptme",
        "language": "Python",
        "category": "AI工具",
        "subcategory": "AI助手",
        "niche": "本地AI代码助手",
        "difficulty": "高",
        "target_user": "程序员、开发者",
        "pain_point": "需要AI帮写代码，但不想用云服务",
        "pricing": {
            "个人版": "$14.9/月",
            "专业版": "$39.9/月"
        },
        "lazy_score": 89
    },
    {
        "name": "Daft",
        "stars": 5533,
        "desc": "High-performance data engine for AI and multimodal workloads.",
        "url": "https://github.com/Eventual-Inc/Daft",
        "language": "Rust",
        "category": "数据工具",
        "subcategory": "数据处理",
        "niche": "AI数据批量处理",
        "difficulty": "高",
        "target_user": "AI工程师、数据科学家",
        "pain_point": "处理大量图片/音频/视频数据太慢",
        "pricing": {
            "按处理量": "$0.01/GB",
            "月卡": "$49.9/月"
        },
        "lazy_score": 86
    },
]


def format_project(p):
    return f"""
项目：{p['name']} ⭐{p['stars']}
分类：{p['category']} - {p['subcategory']}
细分赛道：{p['niche']}
目标用户：{p['target_user']}
痛点：{p['pain_point']}
定价：{', '.join([f'{k}:{v}' for k, v in p['pricing'].items()])}
懒人评分：{p['lazy_score']}/100
链接：{p['url']}
"""


def main():
    print("=" * 100)
    print("🎯 2026-05-29 新批次懒人服务项目挖掘")
    print("=" * 100)
    print(f"\n📊 共挖掘 {len(PROJECTS)} 个新项目\n")

    # 按评分排序
    PROJECTS.sort(key=lambda x: -x['lazy_score'])

    # 分类展示
    categories = {}
    for p in PROJECTS:
        cat = p['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(p)

    for cat, projects in categories.items():
        print(f"\n--- {cat} ({len(projects)}个项目) ---")
        for p in projects:
            print(f"  ⭐{p['stars']:<8} {p['name']:<20} - {p['niche']}")

    # 详细TOP 10
    print("\n" + "=" * 100)
    print("🏆 TOP 10 最有潜力项目\n")

    for i, p in enumerate(PROJECTS[:10], 1):
        print(f"【第{i}名】")
        print(f"项目：{p['name']} ⭐{p['stars']}")
        print(f"细分赛道：{p['niche']}")
        print(f"目标用户：{p['target_user']}")
        print(f"核心痛点：{p['pain_point']}")
        print(f"定价策略：{', '.join([f'{k} {v}' for k, v in p['pricing'].items()])}")
        print(f"链接：{p['url']}")
        print(f"懒人评分：{p['lazy_score']}/100")
        print()

    # 推荐赛道
    print("\n" + "=" * 100)
    print("💡 推荐赛道排序\n")

    top_tracks = sorted([p for p in PROJECTS if p['lazy_score'] >= 85], key=lambda x: -x['lazy_score'])
    for i, p in enumerate(top_tracks, 1):
        print(f"{i}. {p['niche']} ({p['name']} ⭐{p['stars']})")
        print(f"   - 目标用户：{p['target_user']}")
        print(f"   - 预期月收入：${p['stars'] // 1000 * 10}-${p['stars'] // 500 * 10}")
        print(f"   - 懒人评分：{p['lazy_score']}/100")
        print()

    print("=" * 100)


if __name__ == "__main__":
    main()
