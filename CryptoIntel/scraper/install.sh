#!/bin/bash
# 爬虫层安装脚本

echo "=============================================="
echo "CryptoIntel 爬虫层安装"
echo "=============================================="

# 检查 Python 版本
echo ""
echo "🩺 检查 Python 版本..."
python3 --version

# 创建虚拟环境
echo ""
echo "🐍 创建虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 升级 pip
echo ""
echo "📦 升级 pip..."
pip install --upgrade pip

# 安装依赖
echo ""
echo "📦 安装爬虫依赖..."
pip install twitter-cli
pip install rdt-cli
pip install yt-dlp
pip install feedparser
pip install requests
pip install beautifulsoup4

# 检查工具
echo ""
echo "🩺 检查安装的工具..."
echo "   twitter-cli: $(which twitter || echo '❌ 未安装')"
echo "   rdt-cli: $(which rdt || echo '❌ 未安装')"
echo "   yt-dlp: $(which yt-dlp || echo '❌ 未安装')"

echo ""
echo "=============================================="
echo "✅ 爬虫层安装完成!"
echo "=============================================="
echo ""
echo "下一步:"
echo ""
echo "1. 激活虚拟环境:"
echo "   source venv/bin/activate"
echo ""
echo "2. 配置 Twitter 认证:"
echo "   export TWITTER_AUTH_TOKEN='your_token'"
echo "   export TWITTER_CT0='your_ct0'"
echo ""
echo "3. 配置 Reddit 认证:"
echo "   rdt login"
echo ""
echo "4. 测试收集:"
echo "   python3 -m collectors.crypto_collector"
echo ""