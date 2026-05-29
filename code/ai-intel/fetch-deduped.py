#!/usr/bin/env python3

import json
import sys
import subprocess
import time

# ============================================
# 全新项目抓取 - 完全去重
# ============================================

# 去重库
EXISTING_PROJECTS = {
    "openclaw", "ECC", "hermes-agent", "markitdown", "firecrawl",
    "awesome-llm-apps", "skills", "gemini-cli", "browser-use", "ui-ux-pro-max-skill",
    "ohmyzsh", "bat", "fd", "hyperfine", "navi", "powerlevel9k", "ani-cli",
    "shell_gpt", "bandwhich", "presenterm", "oh-my-pi", "grex", "xh", "gitsome",
    "pastel", "gitlogue", "YouPlot", "plow", "gptme", "laravel-zero", "claude-code",
    "ascii-image-converter", "crawlee", "maxun", "crawlee-python", "Daft",
    "reactive-resume", "Resume-Matcher", "Awesome-CV", "ResumeSample",
    "best-resume-ever", "career-ops", "Jobs_Applier_AI_Agent_AIHawk",
    "interviews", "LeetCode-Solutions", "coding-interview-university",
    "freeCodeCamp", "chinese-xinhua", "hangzhou_house_knowledge",
    "Awesome-Freelance-Chinese", "awesome-cheatsheets",
    "Awesome-China-International-Schools", "dog-api", "newspaper",
    "upscayl", "Awesome-China-Second-Hand-Car", "CS-Books", "media-downloader",
    "fzf", "starship", "rg", "ripgrep", "lazygit", "neovim", "pandoc", "yt-dlp",
    "youtube-dl", "pdftk", "pdftohtml", "pdftocairo", "qpdf", "ffmpeg", "whisper",
    "homebrew", "brew", "docker-compose", "kubernetes", "Scrapling", "EasySpider",
    "html2canvas", "screenshot-to-code", "cheerio", "simdjson", "MediaCrawler",
}

# 全新关键词 - 完全不重复
NEW_KEYWORDS = [
    "password manager",
    "2fa authenticator",
    "backup sync",
    "note taking",
    "knowledge base",
    "todo app",
    "calendar scheduling",
    "passwordless",
    "e-signature",
    "contract management",
    "invoice generator",
    "receipt scanner",
    "music production",
    "daw",
    "recipe cooking",
    "meal planner",
    "game dev tool",
    "game engine",
    "3d modelling",
    "blender addon",
    "photo editing",
    "photography workflow",
    "podcast editor",
    "video editor",
    "writing tool",
    "novel generator",
    "story writing",
    "real estate",
    "property management",
    "rental management",
    "medical record",
    "health tracker",
    "fitness app",
    "workout log",
    "iot device",
    "embedded system",
    "firmware tool",
]

def fetch_github_projects(keyword, per_page=20):
    query = f"{keyword} stars:>2000"
    try:
        cmd = [
            "curl", "-s", "--connect-timeout", "15",
            f"https://api.github.com/search/repositories?q={query.replace(' ', '+')}&sort=stars&order=desc&per_page={per_page}"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if "items" in data:
                return data["items"]
    except Exception as e:
        print(f"  Error fetching {keyword}: {e}")
    return []

def dedup_and_filter(projects):
    new_projects = []
    for p in projects:
        name = p["name"].lower()
        if name not in EXISTING_PROJECTS:
            EXISTING_PROJECTS.add(name)
            new_projects.append(p)
    return new_projects

def main():
    print("=" * 100)
    print("🎯 去重后全新项目抓取 - 2026-05-29")
    print("=" * 100)
    
    all_new_projects = []
    
    for i, keyword in enumerate(NEW_KEYWORDS, 1):
        print(f"\n[{i}/{len(NEW_KEYWORDS)}] 抓取关键词: {keyword}")
        
        projects = fetch_github_projects(keyword, 25)
        if not projects:
            print("  无结果")
            continue
        
        print(f"  原始结果: {len(projects)}")
        
        deduped = dedup_and_filter(projects)
        print(f"  去重后: {len(deduped)}")
        
        all_new_projects.extend(deduped)
        
        time.sleep(0.5)  # 限流
    
    print("\n" + "=" * 100)
    print(f"\n🎉 共抓取到 {len(all_new_projects)} 个全新项目！")
    print("\n---")
    
    # 按Stars排序
    all_new_projects.sort(key=lambda x: -x["stargazers_count"])
    
    print("\n🏆 TOP 30 全新项目：")
    for i, p in enumerate(all_new_projects[:30], 1):
        name = p["name"]
        stars = p["stargazers_count"]
        desc = (p["description"] or "").replace("\n", " ")[:60]
        url = p["html_url"]
        lang = p.get("language", "")
        
        print(f"{i:2d}. {name:<30} ⭐{stars:<8} | {desc:<60}")
        print(f"    {lang:<15} {url}")
    
    # 输出JSON供后续处理
    output = {
        "total": len(all_new_projects),
        "projects": all_new_projects
    }
    
    with open("/workspace/code/ai-intel/deduped-new-projects.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n📁 完整数据已保存到: /workspace/code/ai-intel/deduped-new-projects.json")
    print()

if __name__ == "__main__":
    main()
