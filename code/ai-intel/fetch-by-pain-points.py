#!/usr/bin/env python3

# ============================================
# 全新懒人服务项目挖掘 - 从痛点出发
# 目标：找CLI工具，包装成Web API，按次收费
# ============================================

import subprocess
import json
import time

# ============================================
# 垂直痛点关键词（完全避开之前的）
# ============================================

PAIN_POINTS = [
    # 代码相关痛点
    ("代码对比", "diff tool code compare"),
    ("代码片段搜索", "code search snippet"),
    ("代码格式美化", "code formatter beautify"),
    
    # 网络相关痛点
    ("端口扫描", "port scanner network"),
    ("DNS查询", "dns lookup query"),
    ("网络延迟测试", "network latency ping"),
    ("SSL证书检查", "ssl certificate check"),
    
    # 文件相关痛点
    ("文件批量重命名", "batch rename files"),
    ("文件内容对比", "file diff compare"),
    ("文件查找替换", "find replace files"),
    ("文件编码转换", "file encoding convert"),
    
    # 文本相关痛点
    ("文字统计", "text word count statistics"),
    ("文字去重", "text deduplicate unique"),
    ("文字加密解密", "text encrypt decrypt"),
    ("正则表达式测试", "regex test matcher"),
    
    # 系统相关痛点
    ("进程管理", "process manager kill"),
    ("系统监控", "system monitor stats"),
    ("日志分析", "log analyzer parser"),
    ("磁盘使用分析", "disk usage analyzer"),
    
    # 安全相关痛点
    ("密码生成器", "password generator random"),
    ("密码强度检查", "password strength checker"),
    ("Hash计算", "hash calculate md5 sha"),
    ("UUID生成", "uuid generator"),
    
    # API相关痛点
    ("API请求测试", "api test request"),
    ("API文档生成", "api documentation generator"),
    ("Mock数据生成", "mock data generator fake"),
    ("JSON验证", "json validator"),
    
    # 开发工具痛点
    ("Cron表达式解析", "cron expression parser"),
    ("时区转换", "timezone converter"),
    ("Base64编解码", "base64 encode decode"),
    ("URL编解码", "url encode decode"),
    ("颜色代码转换", "color converter hex rgb"),
    
    # 数据处理痛点
    ("CSV数据验证", "csv validator"),
    ("XML转JSON", "xml to json converter"),
    ("YAML验证器", "yaml validator"),
    ("SQL格式化", "sql formatter beautifier"),
    
    # 其他实用工具
    ("二维码生成", "qr code generator"),
    ("短链接生成", "url shortener"),
    ("UUID转时间", "uuid to timestamp"),
    ("JWT解码", "jwt decode token"),
    ("图片Base64转换", "image base64 converter"),
]

def fetch_github(keyword, min_stars=1000):
    query = f"{keyword} stars:>{min_stars}"
    try:
        cmd = [
            "curl", "-s", "--connect-timeout", "10",
            f"https://api.github.com/search/repositories?q={query.replace(' ', '+')}&sort=stars&order=desc&per_page=15"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if "items" in data:
                return data["items"]
    except Exception as e:
        print(f"  ⚠️ 错误: {e}")
    return []

def main():
    print("=" * 100)
    print("🎯 全新懒人服务项目挖掘 - 从痛点出发")
    print("=" * 100)
    print(f"\n📊 共 {len(PAIN_POINTS)} 个痛点关键词\n")
    
    all_results = []
    
    for i, (pain_point, keyword) in enumerate(PAIN_POINTS, 1):
        print(f"[{i}/{len(PAIN_POINTS)}] 🔍 痛点: {pain_point} ({keyword})")
        
        projects = fetch_github(keyword, 500)
        
        if not projects:
            print("  ❌ 无结果")
            continue
        
        print(f"  ✅ 找到 {len(projects)} 个项目")
        
        for p in projects[:3]:  # 每个痛点取TOP 3
            all_results.append({
                "pain_point": pain_point,
                "keyword": keyword,
                "name": p["name"],
                "stars": p["stargazers_count"],
                "description": p.get("description", ""),
                "url": p["html_url"],
                "language": p.get("language", ""),
            })
        
        time.sleep(0.3)  # 限流
    
    print("\n" + "=" * 100)
    print(f"\n🎉 共抓取到 {len(all_results)} 个懒人服务候选项目\n")
    
    # 按Stars排序
    all_results.sort(key=lambda x: -x["stars"])
    
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
    print("🏆 TOP 30 懒人服务候选项目\n")
    
    for i, r in enumerate(unique_results[:30], 1):
        print(f"{i:2d}. {r['name']:<35} ⭐{r['stars']:<8} | 痛点: {r['pain_point']}")
        print(f"    📝 {r['description'][:70]}")
        print(f"    🔗 {r['url']}")
        print()
    
    # 按痛点分类展示
    print("\n" + "=" * 100)
    print("📂 按痛点分类\n")
    
    by_pain = {}
    for r in unique_results:
        pp = r["pain_point"]
        if pp not in by_pain:
            by_pain[pp] = []
        by_pain[pp].append(r)
    
    for pain, projects in sorted(by_pain.items(), key=lambda x: -sum(p["stars"] for p in x[1])):
        total_stars = sum(p["stars"] for p in projects)
        print(f"\n🔸 {pain} ({len(projects)}个项目, 总⭐{total_stars})")
        for p in projects[:3]:
            print(f"   - {p['name']} ⭐{p['stars']}")
    
    # 保存结果
    with open("/workspace/code/ai-intel/pain-point-projects.json", "w", encoding="utf-8") as f:
        json.dump(unique_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n✅ 结果已保存到: /workspace/code/ai-intel/pain-point-projects.json")

if __name__ == "__main__":
    main()
