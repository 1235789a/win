# 🤖 CryptoIntel - 加密项目情报系统

## 📊 项目概述

CryptoIntel 是一个**模块化的加密项目情报系统**，包含：
- **爬虫层** - 基于 Agent-Reach 架构的智能爬虫
- **分析层** - 四维分析引擎（Pain-to-Money、Traffic、SEO、USDT兼容性）

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    CryptoIntel                          │
│               加密项目情报系统                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │           🌐 CryptoIntel Scraper                │  │
│  │           (爬虫层 - Agent-Reach)                │  │
│  ├─────────────────────────────────────────────────┤  │
│  │  Channels:                                      │  │
│  │  ✅ Twitter/X (twitter-cli)                    │  │
│  │  ✅ Reddit (rdt-cli)                           │  │
│  │  ✅ YouTube (yt-dlp)                           │  │
│  │  ✅ Medium/Blog (Jina Reader)                  │  │
│  │  ✅ RSS Feeds (feedparser)                     │  │
│  │  ⬜ Telegram (待开发)                          │  │
│  │  ⬜ Discord (待开发)                            │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │           📊 统一数据格式                        │  │
│  │  - platform: 来源平台                          │  │
│  │  - project_name: 项目名称                      │  │
│  │  - post_url: 原文链接                          │  │
│  │  - post_text: 正文内容                         │  │
│  │  - asset_type: 资产类型                        │  │
│  │  - engagement: 互动数据                        │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │           🔍 四维分析引擎                        │  │
│  │           (分析层)                              │  │
│  ├─────────────────────────────────────────────────┤  │
│  │  维度1: Pain-to-Money Signal (25分)          │  │
│  │  维度2: Traffic Acquisition Score (20分)      │  │
│  │  维度3: SEO/GEO Potential (20分)              │  │
│  │  维度4: USDT Compatibility (10分)             │  │
│  │  维度5: Competition Gap (15分)                │  │
│  │  维度6: Build Speed (10分)                   │  │
│  │                                                  │  │
│  │  P0 (≥75分): 极品机会                         │  │
│  │  P1 (60-74分): 优秀机会                       │  │
│  │  P2 (45-59分): 一般机会                       │  │
│  │  P3 (<45分): 观察                            │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │           💰 套利机会输出                        │  │
│  │  - 机会列表 (按优先级排序)                      │  │
│  │  - Blueprint (MVP方案)                        │  │
│  │  - 目标领域分析                                │  │
│  │  - 快速验证建议                                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
CryptoIntel/
├── 📂 scraper/                    # 爬虫层（基于Agent-Reach）
│   ├── agent_reach/              # Agent-Reach核心
│   │   ├── channels/             # 平台Channel
│   │   │   ├── twitter.py        # Twitter Channel
│   │   │   ├── reddit.py         # Reddit Channel
│   │   │   ├── youtube.py        # YouTube Channel
│   │   │   ├── medium.py         # Medium Channel
│   │   │   ├── rss.py            # RSS Channel
│   │   │   └── crypto_marketing.py # 加密营销Channel
│   │   ├── integrations/         # 集成
│   │   │   └── mcp_server.py     # MCP Server
│   │   └── core.py              # 核心工具
│   ├── collectors/               # 收集器
│   │   ├── crypto_collector.py  # 加密项目收集器
│   │   ├── twitter_collector.py # Twitter收集器
│   │   └── reddit_collector.py  # Reddit收集器
│   ├── utils/                   # 工具函数
│   ├── install.sh              # 安装脚本
│   └── requirements.txt        # 依赖
│
├── 📂 analyzer/                  # 分析层（四维分析）
│   ├── src/
│   │   ├── lib/
│   │   │   ├── two-step-analyze.ts    # 两步分析
│   │   │   ├── final-score.ts         # 评分系统
│   │   │   ├── scorer.ts             # 评分器
│   │   │   ├── cleaner.ts            # 数据清洗
│   │   │   ├── clustering.ts         # 聚类
│   │   │   └── catalysts.ts          # 信号检测
│   │   ├── prompts/                  # Prompt模板
│   │   │   ├── step1-prompt.ts
│   │   │   └── step2-prompt.ts
│   │   └── app/                      # Next.js界面
│   │       ├── page.tsx
│   │       ├── analyze/page.tsx
│   │       └── opportunities/page.tsx
│   ├── scripts/                 # 脚本
│   │   ├── harvester_v2.ts    # 数据采集
│   │   └── list-all.ts       # 列出机会
│   ├── data/                  # 数据
│   │   └── intel.db          # SQLite数据库
│   └── package.json
│
├── 📂 shared/                  # 共享模块
│   ├── types/                 # 类型定义
│   │   ├── scraped-data.ts   # 爬虫数据格式
│   │   ├── analyzed-data.ts   # 分析数据格式
│   │   └── opportunity.ts     # 机会格式
│   ├── utils/                 # 工具函数
│   └── constants/             # 常量
│
├── 📂 docs/                    # 文档
│   ├── setup.md               # 安装指南
│   ├── usage.md               # 使用指南
│   └── api-reference.md       # API参考
│
├── 📂 scripts/                 # 便捷脚本
│   ├── install-all.sh         # 一键安装
│   ├── run-scraper.sh         # 运行爬虫
│   └── run-analyzer.sh        # 运行分析
│
├── .env.example               # 环境变量模板
├── .gitignore
├── README.md
├── ARCHITECTURE.md            # 架构文档
└── LICENSE
```

---

## 🔧 安装

### 一键安装

```bash
# 克隆项目
git clone https://github.com/your-username/CryptoIntel.git
cd CryptoIntel

# 运行一键安装
chmod +x scripts/install-all.sh
./scripts/install-all.sh
```

### 手动安装

**爬虫层：**
```bash
cd scraper
chmod +x install.sh
./install.sh

# 配置认证
export TWITTER_AUTH_TOKEN="your_token"
export TWITTER_CT0="your_ct0"
rdt login
```

**分析层：**
```bash
cd ../analyzer
npm install
```

---

## 🚀 使用

### 1. 收集数据

```bash
cd scraper
python3 -m collectors.crypto_collector --limit 100 --output ../data/raw.json
```

### 2. 分析数据

```bash
cd ../analyzer
npm run analyze -- --input ../data/raw.json --output ../data/analyzed.json
```

### 3. 查看结果

```bash
npm run list-opportunities -- --min-score 60
```

---

## 📊 数据格式

### 爬虫输出格式

```json
{
  "platform": "twitter",
  "project_name": "Bitcoin",
  "project_url": "https://x.com/Bitcoin",
  "post_url": "https://x.com/Bitcoin/status/123456",
  "image_url": "",
  "date": "2026-06-05T10:30:00",
  "engagement": {
    "likes": 5000,
    "retweets": 1200,
    "replies": 300
  },
  "asset_type": "Airdrop",
  "post_text": "Big announcement...",
  "collected_at": "2026-06-05T12:00:00",
  "source": "agent-reach"
}
```

### 分析输出格式

```json
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
    "target_users": "Crypto investors seeking airdrops",
    "monetization": "Freemium + USDT payment"
  }
}
```

---

## 📈 四维分析体系

### 评分维度

| 维度 | 分数 | 说明 |
|------|------|------|
| Pain-to-Money Signal | 25 | 用户痛点到付费意愿的转化 |
| Traffic Acquisition | 20 | 获取流量的难易程度 |
| SEO/GEO Potential | 20 | 搜索引擎/地理优化潜力 |
| USDT Compatibility | 10 | 与USDT收款模式的兼容性 |
| Competition Gap | 15 | 市场竞争缺口 |
| Build Speed | 10 | 2-4周内完成的可能性 |

### 优先级定义

| 优先级 | 分数范围 | 说明 |
|--------|---------|------|
| P0 | ≥75 | 极品机会，立即行动 |
| P1 | 60-74 | 优秀机会，重点关注 |
| P2 | 45-59 | 一般机会，谨慎评估 |
| P3 | <45 | 观察，不急于行动 |

---

## 🌐 支持的平台

### 爬虫层

| 平台 | 工具 | 认证 | 状态 |
|------|------|------|------|
| Twitter/X | twitter-cli | Cookie | ✅ |
| Reddit | rdt-cli | Cookie | ✅ |
| YouTube | yt-dlp | 无 | ✅ |
| Medium | Jina Reader | 无 | ✅ |
| RSS | feedparser | 无 | ✅ |
| Telegram | 待开发 | Bot Token | ⬜ |
| Discord | 待开发 | Bot Token | ⬜ |

### 分析层

| 功能 | 工具 | 状态 |
|------|------|------|
| 数据分析 | TypeScript + Node.js | ✅ |
| AI评分 | OpenAI/Claude API | ✅ |
| 数据库 | SQLite | ✅ |
| Web界面 | Next.js | ✅ |

---

## 📝 开发

### 添加新的爬虫Channel

```python
# scraper/agent_reach/channels/my_platform.py

from .base import Channel

class MyPlatformChannel(Channel):
    name = "my_platform"
    description = "My Platform 描述"
    backends = ["my-cli-tool"]
    tier = 1
    
    def can_handle(self, url: str) -> bool:
        return "myplatform.com" in url
    
    def check(self, config=None):
        # 检查工具是否可用
        if shutil.which("my-cli"):
            return "ok", "可用"
        return "off", "需要安装 my-cli"
```

### 添加新的分析维度

```typescript
// analyzer/src/lib/new-dimension.ts

export async function analyzeNewDimension(
  data: ScraperData
): Promise<number> {
  // 分析逻辑
  return score; // 0-25分
}
```

---

## 📚 文档

- [安装指南](docs/setup.md)
- [使用指南](docs/usage.md)
- [API参考](docs/api-reference.md)
- [架构设计](ARCHITECTURE.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT License

---

## 🙏 致谢

- [Agent-Reach](https://github.com/Panniantong/Agent-Reach) - 爬虫框架
- [twitter-cli](https://github.com/public-clis/twitter-cli) - Twitter CLI工具
- [rdt-cli](https://github.com/public-clis/rdt-cli) - Reddit CLI工具
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - 视频下载工具
- [Jina AI Reader](https://github.com/jina-ai/reader) - 网页读取服务