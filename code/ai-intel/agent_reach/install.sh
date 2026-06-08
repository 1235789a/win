#!/bin/bash
# Agent-Reach 加密项目营销数据收集器安装脚本

echo "=============================================="
echo "Agent-Reach 加密项目营销数据收集器"
echo "安装脚本"
echo "=============================================="

# 检查 Python 版本
echo ""
echo "🩺 检查 Python 版本..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python 版本: $python_version"

# 安装 Agent-Reach
echo ""
echo "📦 安装 Agent-Reach..."
pip3 install agent-reach

# 安装上游工具
echo ""
echo "🔧 安装上游工具..."

echo "   安装 twitter-cli..."
pip3 install twitter-cli

echo "   安装 rdt-cli..."
pip3 install rdt-cli

echo "   安装 yt-dlp..."
pip3 install yt-dlp

echo "   安装 feedparser..."
pip3 install feedparser

# 运行诊断
echo ""
echo "🩺 运行诊断..."
agent-reach doctor

# 提示配置
echo ""
echo "=============================================="
echo "✅ 安装完成!"
echo "=============================================="
echo ""
echo "下一步:"
echo ""
echo "1. 配置 Twitter 认证:"
echo "   export TWITTER_AUTH_TOKEN='your_token'"
echo "   export TWITTER_CT0='your_ct0'"
echo ""
echo "   如何获取:"
echo "   - 在浏览器登录 x.com"
echo "   - 打开开发者工具 (F12)"
echo "   - Application → Cookies → x.com"
echo "   - 复制 auth_token 和 ct0"
echo ""
echo "2. 配置 Reddit 认证:"
echo "   rdt login"
echo ""
echo "3. 运行收集器:"
echo "   cd /workspace/code/ai-intel/agent_reach"
echo "   python3 crypto_marketing_channel.py"
echo ""
echo "=============================================="

# 创建配置文件模板
echo ""
echo "📝 创建配置文件模板..."
mkdir -p ~/.agent-reach
cat > ~/.agent-reach/config.yaml << 'EOF'
# Agent-Reach 配置文件

twitter:
  enabled: true
  auth_token: ""  # 从浏览器 Cookie 获取
  ct0: ""         # 从浏览器 Cookie 获取

reddit:
  enabled: true
  # 运行 rdt login 自动配置

youtube:
  enabled: true
  # yt-dlp 无需配置

web:
  enabled: true
  # Jina Reader 无需配置

crypto_marketing:
  enabled: true
  accounts:
    - Bitcoin
    - ethereum
    - VitalikButerin
    - Coinbase
    - binance
    - Solana
    - Cardano
    - Polkadot
    - Avalanche
    - Polygon
    - chainlink
    - Uniswap
    - AaveAave
    - MakerDAO
    - arbitrum
    - Optimism
    - ZkSync
    - base
    - dogecoin
    - Shibtoken
  
  subreddits:
    - cryptocurrency
    - CryptoCurrency
    - CryptoMarkets
    - altcoin
    - Bitcoin
    - ethereum
    - Defi
EOF

echo "   ✅ 配置文件已创建: ~/.agent-reach/config.yaml"
echo ""
echo "请编辑配置文件，填入你的认证信息"