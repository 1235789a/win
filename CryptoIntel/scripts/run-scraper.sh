#!/bin/bash
# 运行爬虫脚本

echo "=============================================="
echo "CryptoIntel 爬虫"
echo "=============================================="

# 激活虚拟环境
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# 运行爬虫
cd scraper
python3 -m collectors.crypto_collector --limit 100 --output ../data/raw.json

echo ""
echo "✅ 爬虫运行完成"
echo "📁 数据保存在 ../data/raw.json"