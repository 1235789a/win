#!/usr/bin/env python3

# ============================================
# 去重 + 重新抓取 - 2026-05-29
# ============================================

# 之前所有已抓过的项目库
EXISTING_PROJECTS = {
    # 第一波
    "openclaw", "ECC", "hermes-agent", "markitdown", "firecrawl",
    "awesome-llm-apps", "skills", "gemini-cli", "browser-use", "ui-ux-pro-max-skill",
    
    # 第二波
    "ohmyzsh", "bat", "fd", "hyperfine", "navi", "powerlevel9k", "ani-cli",
    "shell_gpt", "bandwhich", "presenterm", "oh-my-pi", "grex", "xh", "gitsome",
    "pastel", "gitlogue", "YouPlot", "plow", "gptme", "laravel-zero", "claude-code",
    "ascii-image-converter", "crawlee", "maxun", "crawlee-python", "Daft",
    
    # 简历优化相关
    "reactive-resume", "Resume-Matcher", "Awesome-CV", "ResumeSample",
    "best-resume-ever", "career-ops", "Jobs_Applier_AI_Agent_AIHawk",
    "interviews", "LeetCode-Solutions", "coding-interview-university",
    "freeCodeCamp", "chinese-xinhua", "hangzhou_house_knowledge",
    "Awesome-Freelance-Chinese", "awesome-cheatsheets",
    "Awesome-China-International-Schools", "dog-api", "newspaper",
    "upscayl", "Awesome-China-Second-Hand-Car", "CS-Books", "media-downloader",
    
    # 其他之前出现过的
    "fzf", "starship", "rg", "ripgrep", "lazygit", "neovim", "pandoc", "yt-dlp",
    "yt-dlp", "youtube-dl", "yt-dlp",
    
    # PDF类
    "pdftk", "pdftohtml", "pdftocairo", "qpdf",
    
    # 视频音频
    "ffmpeg", "whisper", "yt-dlp",
    
    # 其他通用工具
    "homebrew", "brew", "docker-compose", "kubernetes",
}

EXISTING_KEYWORDS = {
    "cli", "terminal", "command", "command-line",
    "pdf", "document", "markdown", "converter",
    "audio", "video", "image", "media",
    "speech", "voice", "tts", "whisper",
    "llm", "chatgpt", "gpt", "agent", "ai-assistant",
    "automation", "scraper", "crawler",
}

# ============================================
# 新抓取标准
# ============================================

NEW_KEYWORDS = [
    # 垂直行业
    "real-estate", "property", "rental", "housing",
    "healthcare", "medical", "doctor", "hospital",
    "finance", "stock", "trading", "crypto", "invest",
    "education", "tutor", "learning", "course",
    "design", "art", "photo", "illustration",
    
    # 小众技术
    "embedded", "iot", "firmware",
    "game", "game-dev", "gaming",
    "3d", "blender", "maya", "3d-modelling",
    "music", "audio-production", "daw",
    "writing", "novel", "story", "fiction",
    "law", "legal", "contract",
    "cooking", "recipe", "food",
    
    # 具体场景
    "password", "2fa", "security",
    "backup", "sync", "cloud",
    "note", "knowledge", "wiki",
    "calendar", "schedule", "todo",
    "git", "github", "version-control",
    
    # 特定职业
    "photography", "video-editing",
    "writing", "blogging",
    "podcasting", "recording",
]

print("=" * 100)
print("🎯 去重 + 全新项目抓取计划")
print("=" * 100)
print(f"\n📚 已去重项目库：{len(EXISTING_PROJECTS)}个项目")
print(f"\n🔍 新关键词方向：")
for kw in NEW_KEYWORDS[:10]:
    print(f"  - {kw}")

print("\n" + "=" * 100)
print("\n接下来将抓取全新关键词，避免和之前重复...")
print()
