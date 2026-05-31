#!/bin/bash
# 连续运行10次采集脚本

echo "🚀 开始连续运行 10 次采集..."
echo "================================"

for i in {1..10}; do
    echo ""
    echo "【第 $i/10 次采集】"
    echo "================================"
    
    # 随机选择数据源和参数
    SOURCES="hn,github,devto"
    MAX_ITEMS=$((RANDOM % 30 + 50))  # 随机 50-80 条
    MAX_AGE_HOURS=$((RANDOM % 144 + 24))  # 随机 24-168 小时（1-7天）
    
    echo "数据源: $SOURCES"
    echo "最大条数: $MAX_ITEMS"
    echo "最大内容年龄: ${MAX_AGE_HOURS}小时"
    echo ""
    
    cd /workspace/code/ai-intel
    SOURCES=$SOURCES MAX_ITEMS=$MAX_ITEMS MAX_AGE_HOURS=$MAX_AGE_HOURS npx tsx scripts/harvester_v2.ts
    
    echo ""
    echo "✅ 第 $i 次采集完成"
    echo "休息 3 秒后开始下一次..."
    sleep 3
done

echo ""
echo "🎉 全部 10 次采集完成！"
echo "================================"
echo "查看结果：curl http://localhost:3000/api/opportunities"
