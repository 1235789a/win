#!/bin/bash
# CryptoIntel 一键安装脚本

set -e

echo "=============================================="
echo "CryptoIntel 安装脚本"
echo "加密项目情报系统 - 爬虫 + 分析"
echo "=============================================="

# 检查 Python
echo ""
echo "🩺 检查 Python..."
python3 --version

# 检查 Node.js
echo ""
echo "🩺 检查 Node.js..."
node --version || echo "⚠️ Node.js 未安装"

# 创建虚拟环境
echo ""
echo "🐍 创建 Python 虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 安装爬虫依赖
echo ""
echo "📦 安装爬虫依赖..."
cd scraper
pip install --upgrade pip
pip install twitter-cli
pip install rdt-cli
pip install yt-dlp
pip install feedparser
pip install requests
pip install beautifulsoup4
cd ..

# 复制 Agent-Reach
echo ""
echo "📦 复制 Agent-Reach..."
cp -r /workspace/agent-reach/* scraper/agent_reach/

# 安装分析依赖
echo ""
echo "📦 安装分析依赖..."
cd analyzer
npm install
cd ..

# 创建数据目录
echo ""
echo "📁 创建数据目录..."
mkdir -p data
mkdir -p analyzer/data

# 创建环境变量模板
echo ""
echo "📝 创建环境变量模板..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 请编辑 .env 文件配置 API 密钥"
fi

echo ""
echo "=============================================="
echo "✅ 安装完成!"
echo "=============================================="
echo ""
echo "下一步:"
echo ""
echo "1. 配置爬虫认证:"
echo "   export TWITTER_AUTH_TOKEN='your_token'"
echo "   export TWITTER_CT0='your_ct0'"
echo "   source venv/bin/activate"
echo "   rdt login"
echo ""
echo "2. 配置分析 API:"
echo "   编辑 .env 文件，填入 OPENAI_API_KEY"
echo ""
echo "3. 运行爬虫:"
echo "   cd scraper"
echo "   source ../venv/bin/activate"
echo "   python3 -m collectors.crypto_collector"
echo ""
echo "4. 运行分析:"
echo "   cd analyzer"
echo "   npm run analyze"
echo ""
echo "=============================================="