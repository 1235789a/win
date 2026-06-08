# CryptoIntel 使用指南

## 🚀 快速开始

### 1. 收集数据

```bash
# 进入项目目录
cd CryptoIntel

# 激活爬虫环境
cd scraper
source venv/bin/activate

# 运行收集器
python3 -m collectors.crypto_collector --limit 100 --output ../data/raw.json
```

### 2. 分析数据

```bash
# 新开终端，进入分析目录
cd CryptoIntel/analyzer

# 运行分析
npm run analyze -- --input ../data/raw.json --output ../data/analyzed.json
```

### 3. 查看机会

```bash
# 列出所有机会
npm run list

# 列出极品机会 (P0)
npm run list -- --min-score 75

# 列出优秀机会 (P1)
npm run list -- --min-score 60
```

---

## 📊 命令详解

### 爬虫命令

```bash
# 基础收集
python3 -m collectors.crypto_collector

# 指定数量
python3 -m collectors.crypto_collector --limit 50

# 指定输出文件
python3 -m collectors.crypto_collector --output my-data.json

# 只收集 Twitter
python3 -m collectors.crypto_collector --platforms twitter

# 只收集 Reddit
python3 -m collectors.crypto_collector --platforms reddit

# 收集所有平台
python3 -m collectors.crypto_collector --platforms twitter,reddit,youtube
```

### 分析命令

```bash
# 基础分析
npm run analyze

# 指定输入文件
npm run analyze -- --input my-data.json

# 指定输出文件
npm run analyze -- --output my-results.json

# 最小分数过滤
npm run analyze -- --min-score 60

# 最大机会数
npm run analyze -- --max-opportunities 50
```

### 查看命令

```bash
# 列出所有机会
npm run list

# 按分数排序
npm run list -- --sort score

# 按优先级排序
npm run list -- --sort priority

# 只显示 P0
npm run list -- --priority P0

# 显示详细信息
npm run list -- --verbose

# 导出为 CSV
npm run list -- --format csv --output opportunities.csv
```

---

## 🌐 Web 界面

启动 Web 服务器：

```bash
cd analyzer
npm run dev
```

访问 http://localhost:3000

### 功能

- **仪表盘**: 查看统计概览
- **分析**: 上传数据并分析
- **机会**: 浏览和筛选机会
- **趋势**: 查看市场趋势

---

## 📡 API 接口

### 收集数据

```bash
# POST /api/collect
curl -X POST http://localhost:3000/api/collect \
  -H "Content-Type: application/json" \
  -d '{"platforms": ["twitter", "reddit"], "limit": 50}'
```

### 分析数据

```bash
# POST /api/analyze
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"data": [...]}'
```

### 获取机会

```bash
# GET /api/opportunities
curl http://localhost:3000/api/opportunities?min_score=60

# GET /api/opportunities/:id
curl http://localhost:3000/api/opportunities/opp_123
```

---

## 🔧 高级用法

### 定时任务

使用 cron 定时收集和分析数据：

```bash
# 编辑 crontab
crontab -e

# 每天早上 8 点收集数据
0 8 * * * cd /path/to/CryptoIntel && ./scripts/run-scraper.sh >> /path/to/logs/scraper.log 2>&1

# 每天早上 9 点分析数据
0 9 * * * cd /path/to/CryptoIntel && ./scripts/run-analyzer.sh >> /path/to/logs/analyzer.log 2>&1
```

### Webhook 通知

配置 Webhook，在发现新机会时通知：

```bash
# 设置 Webhook URL
export WEBHOOK_URL="https://your-webhook.com/notify"

# 运行分析（会自动发送 Webhook）
npm run analyze -- --webhook
```

### 自定义平台

添加新的数据平台：

1. 创建 Channel 文件：`scraper/agent_reach/channels/my_platform.py`
2. 注册到收集器
3. 重启服务

---

## 📊 数据格式

### 输入格式

```json
[
  {
    "platform": "twitter",
    "project_name": "Bitcoin",
    "post_url": "https://x.com/Bitcoin/status/123456",
    "post_text": "Big announcement about airdrop",
    "date": "2026-06-05T10:30:00",
    "engagement": {
      "likes": 5000,
      "retweets": 1200
    }
  }
]
```

### 输出格式

```json
[
  {
    "id": "opp_123",
    "name": "Bitcoin Airdrop Tracker",
    "target_niche": "Crypto Airdrop Hunters",
    "total_score": 78,
    "dimensions": {
      "pain_to_money": 22,
      "traffic": 18,
      "seo": 16,
      "usdt": 8,
      "competition": 10,
      "build_speed": 4
    },
    "priority": "P0",
    "blueprint": {
      "mvp_features": ["Airdrop listing", "Calendar", "Alerts"],
      "target_users": "Crypto investors",
      "monetization": "Freemium + USDT"
    }
  }
]
```

---

## 🐛 故障排除

### 问题：收集器返回空数据

**解决方案**：
1. 检查认证是否正确
2. 检查网络连接
3. 查看日志错误信息
4. 尝试重新认证

### 问题：分析超时

**解决方案**：
1. 减少数据量（--limit 50）
2. 检查 API 额度
3. 增加超时时间

### 问题：数据库错误

**解决方案**：
1. 检查数据库文件权限
2. 删除损坏的数据库重新创建
3. 检查磁盘空间

---

## 📞 获取帮助

- **GitHub Issues**: https://github.com/your-username/CryptoIntel/issues
- **文档**: 查看 [docs/](docs/) 目录
- **社区**: 加入我们的 Discord/Slack

---

## 🎓 下一步

- [API参考](api-reference.md) - 了解更多 API 接口
- [架构设计](../ARCHITECTURE.md) - 了解系统架构
- [开发指南](../README.md#开发) - 如何贡献代码