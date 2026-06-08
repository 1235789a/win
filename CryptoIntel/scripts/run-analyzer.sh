#!/bin/bash
# 运行分析脚本

echo "=============================================="
echo "CryptoIntel 分析引擎"
echo "=============================================="

# 检查数据文件
if [ ! -f "../data/raw.json" ]; then
    echo "❌ 错误: 数据文件不存在"
    echo "请先运行爬虫: ./scripts/run-scraper.sh"
    exit 1
fi

# 运行分析
cd analyzer
npm run analyze -- --input ../data/raw.json --output ../data/analyzed.json

echo ""
echo "✅ 分析完成"
echo "📁 结果保存在 ../data/analyzed.json"

# 显示机会列表
echo ""
echo "=============================================="
echo "P0 极品机会 (≥75分):"
echo "=============================================="
npm run list-opportunities -- --min-score 75