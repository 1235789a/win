# 基于 Agent-Reach 重构 AI 情报系统

## 📊 Agent-Reach 核心架构

Agent-Reach 是一个**脚手架工具**，不是框架。它的核心设计：

1. **Channel 模式** - 每个平台一个 Channel 类
2. **上游工具直接调用** - Agent 直接调用 twitter-cli、rdt-cli、yt-dlp 等
3. **零 API 费用** - 使用开源工具，无需付费 API
4. **MCP Server 集成** - 提供 MCP 接口给 AI Agent

## 🎯 重构目标

将现有的 AI 情报获取系统重构为：

```
┌─────────────────────────────────────────────┐
│        AI 情报分析层                          │
│  (现有 two-step-analyze.ts)                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│     Crypto Marketing Channel（新增）         │
│  - TwitterChannel (twitter-cli)            │
│  - RedditChannel (rdt-cli)                 │
│  - YouTubeChannel (yt-dlp)                 │
│  - TelegramChannel (待实现)                 │
│  - MediumChannel (Jina Reader)             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Agent-Reach MCP Server               │
│  (统一接口，AI Agent 直接调用)               │
└─────────────────────────────────────────────┘
```

## 📁 重构后的目录结构

```
/workspace/code/ai-intel/
├── agent_reach/                     # Agent-Reach 集成
│   ├── channels/
│   │   ├── crypto_marketing.py      # 加密项目营销数据 Channel
│   │   ├── twitter.py               # Twitter Channel (继承自 Agent-Reach)
│   │   ├── reddit.py                # Reddit Channel (继承自 Agent-Reach)
│   │   ├── telegram.py              # Telegram Channel (新增)
│   │   └── medium.py                # Medium Channel (新增)
│   ├── collectors/
│   │   ├── crypto_collector.py      # 加密项目统一收集器
│   │   ├── twitter_collector.py     # Twitter 收集器
│   │   └── reddit_collector.py      # Reddit 收集器
│   ├── integrations/
│   │   └── mcp_server.py            # MCP Server (继承自 Agent-Reach)
│   └── config.py                    # 配置管理
├── src/lib/
│   ├── sources/                     # 现有数据源 (保留)
│   ├── two-step-analyze.ts          # 分析逻辑 (保留)
│   └── db.ts                        # 数据库 (保留)
└── scripts/
    ├── collect_crypto_marketing.ts  # 新收集脚本
    └── run-agent-reach.ts           # Agent-Reach 运行脚本
```

## 🔧 重构步骤

### Phase 1: 安装 Agent-Reach

```bash
# 安装 Agent-Reach
pip install agent-reach

# 安装上游工具
pip install twitter-cli
pip install rdt-cli
pip install yt-dlp

# 运行诊断
agent-reach doctor
```

### Phase 2: 创建加密项目营销 Channel

```python
# agent_reach/channels/crypto_marketing.py

from agent_reach.channels.base import Channel
from typing import List, Dict, Tuple
import subprocess
import json

class CryptoMarketingChannel(Channel):
    """加密项目营销数据收集 Channel"""
    
    name = "crypto_marketing"
    description = "加密项目 AMA/Airdrop/Partnership/Listing/Giveaway/Meme 数据"
    backends = ["twitter-cli", "rdt-cli", "yt-dlp", "Jina Reader"]
    tier = 1  # 需要配置
    
    # 加密项目 Twitter 账号列表
    CRYPTO_ACCOUNTS = [
        "Bitcoin", "ethereum", "VitalikButerin", "saylor",
        "Coinbase", "binance", "CryptoCom", "OKX",
        "Solana", "Cardano", "Polkadot", "Avalanche",
        "Polygon", "Chainlink", "Uniswap", "Aave",
        "MakerDAO", "Arbitrum", "Optimism", "ZkSync",
        # ... 更多项目
    ]
    
    # Reddit 加密版块
    CRYPTO_SUBREDDITS = [
        "cryptocurrency", "CryptoCurrency", "CryptoMarkets",
        "altcoin", "Bitcoin", "ethereum", "Defi"
    ]
    
    def can_handle(self, url: str) -> bool:
        """检查是否是加密项目相关 URL"""
        crypto_domains = [
            "x.com", "twitter.com",
            "reddit.com", "redd.it",
            "youtube.com", "youtu.be",
            "medium.com", "t.me"
        ]
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.lower()
        return any(d in domain for d in crypto_domains)
    
    def check(self, config=None) -> Tuple[str, str]:
        """检查所有上游工具是否可用"""
        results = []
        
        # 检查 twitter-cli
        twitter = self._check_twitter_cli()
        results.append(f"Twitter: {twitter}")
        
        # 检查 rdt-cli
        reddit = self._check_rdt_cli()
        results.append(f"Reddit: {reddit}")
        
        # 检查 yt-dlp
        youtube = self._check_yt_dlp()
        results.append(f"YouTube: {youtube}")
        
        # 检查 Jina Reader
        web = self._check_jina_reader()
        results.append(f"Web: {web}")
        
        all_ok = all("ok" in r for r in results)
        status = "ok" if all_ok else "warn"
        message = "\n".join(results)
        
        return status, message
    
    def _check_twitter_cli(self) -> str:
        """检查 twitter-cli"""
        import shutil
        twitter = shutil.which("twitter")
        if not twitter:
            return "未安装 (pip install twitter-cli)"
        
        try:
            r = subprocess.run(
                [twitter, "status"],
                capture_output=True,
                encoding="utf-8",
                timeout=10
            )
            if "ok: true" in r.stdout:
                return "ok (已认证)"
            return "未认证 (需要配置 Cookie)"
        except:
            return "检查失败"
    
    def _check_rdt_cli(self) -> str:
        """检查 rdt-cli"""
        import shutil
        rdt = shutil.which("rdt")
        if not rdt:
            return "未安装 (pip install rdt-cli)"
        
        try:
            r = subprocess.run(
                [rdt, "status", "--json"],
                capture_output=True,
                encoding="utf-8",
                timeout=10
            )
            data = json.loads(r.stdout)
            if data.get("data", {}).get("authenticated"):
                return "ok (已登录)"
            return "未登录 (运行 rdt login)"
        except:
            return "检查失败"
    
    def _check_yt_dlp(self) -> str:
        """检查 yt-dlp"""
        import shutil
        ytdlp = shutil.which("yt-dlp")
        if not ytdlp:
            return "未安装 (pip install yt-dlp)"
        return "ok"
    
    def _check_jina_reader(self) -> str:
        """检查 Jina Reader"""
        # Jina Reader 是在线服务，无需安装
        return "ok (在线服务)"
    
    def collect_all(self, limit_per_source: int = 20) -> List[Dict]:
        """收集所有平台的加密项目营销数据"""
        all_data = []
        
        # 收集 Twitter 数据
        twitter_data = self._collect_twitter(limit_per_source)
        all_data.extend(twitter_data)
        
        # 收集 Reddit 数据
        reddit_data = self._collect_reddit(limit_per_source)
        all_data.extend(reddit_data)
        
        # 收集 YouTube 数据
        youtube_data = self._collect_youtube(limit_per_source)
        all_data.extend(youtube_data)
        
        return all_data
    
    def _collect_twitter(self, limit: int) -> List[Dict]:
        """使用 twitter-cli 收集 Twitter 数据"""
        import subprocess
        import random
        
        data = []
        accounts = random.sample(self.CRYPTO_ACCOUNTS, min(10, len(self.CRYPTO_ACCOUNTS)))
        
        for account in accounts:
            try:
                # 使用 twitter-cli 获取用户推文
                r = subprocess.run(
                    ["twitter", "user", account, "-n", str(limit)],
                    capture_output=True,
                    encoding="utf-8",
                    timeout=30
                )
                
                if r.returncode == 0:
                    tweets = json.loads(r.stdout)
                    for tweet in tweets:
                        data.append({
                            "platform": "twitter",
                            "project_name": account,
                            "post_url": tweet.get("url", ""),
                            "post_text": tweet.get("text", ""),
                            "date": tweet.get("created_at", ""),
                            "engagement": {
                                "likes": tweet.get("likes", 0),
                                "retweets": tweet.get("retweets", 0),
                                "replies": tweet.get("replies", 0)
                            },
                            "asset_type": self._classify_asset_type(tweet.get("text", "")),
                            "source": "agent-reach"
                        })
            except Exception as e:
                print(f"获取 {account} 失败: {e}")
        
        return data
    
    def _collect_reddit(self, limit: int) -> List[Dict]:
        """使用 rdt-cli 收集 Reddit 数据"""
        import subprocess
        
        data = []
        
        for subreddit in self.CRYPTO_SUBREDDITS[:5]:
            try:
                # 使用 rdt-cli 获取 subreddit 帖子
                r = subprocess.run(
                    ["rdt", "subreddit", subreddit, "--limit", str(limit)],
                    capture_output=True,
                    encoding="utf-8",
                    timeout=30
                )
                
                if r.returncode == 0:
                    posts = json.loads(r.stdout)
                    for post in posts:
                        data.append({
                            "platform": "reddit",
                            "project_name": f"r/{subreddit}",
                            "post_url": post.get("url", ""),
                            "post_text": post.get("title", ""),
                            "date": post.get("created_at", ""),
                            "engagement": {
                                "score": post.get("score", 0),
                                "comments": post.get("comments", 0)
                            },
                            "asset_type": self._classify_asset_type(post.get("title", "")),
                            "source": "agent-reach"
                        })
            except Exception as e:
                print(f"获取 r/{subreddit} 失败: {e}")
        
        return data
    
    def _collect_youtube(self, limit: int) -> List[Dict]:
        """使用 yt-dlp 收集 YouTube 数据"""
        # YouTube 收集逻辑
        return []
    
    def _classify_asset_type(self, text: str) -> str:
        """分类资产类型"""
        if not text:
            return "Other"
        
        text_lower = text.lower()
        
        if any(k in text_lower for k in ["ama", "ask me anything"]):
            return "AMA"
        elif any(k in text_lower for k in ["airdrop", "giveaway", "free", "claim"]):
            return "Airdrop"
        elif any(k in text_lower for k in ["partnership", "collaboration"]):
            return "Partnership"
        elif any(k in text_lower for k in ["listing", "exchange", "trading"]):
            return "Listing"
        elif any(k in text_lower for k in ["giveaway", "win", "prize"]):
            return "Giveaway"
        elif any(k in text_lower for k in ["meme", "funny"]):
            return "Meme"
        else:
            return "Other"
```

### Phase 3: 创建 MCP Server 集成

```python
# agent_reach/integrations/crypto_mcp_server.py

from agent_reach.integrations.mcp_server import MCPServer
from agent_reach.channels.crypto_marketing import CryptoMarketingChannel
from typing import List, Dict

class CryptoMarketingMCPServer(MCPServer):
    """加密项目营销数据 MCP Server"""
    
    def __init__(self):
        super().__init__()
        self.crypto_channel = CryptoMarketingChannel()
        
        # 注册工具
        self.register_tool(
            name="collect_crypto_marketing",
            description="收集加密项目营销数据（AMA、Airdrop、Partnership、Listing、Giveaway、Meme）",
            handler=self.collect_crypto_marketing
        )
        
        self.register_tool(
            name="search_crypto_twitter",
            description="搜索加密项目 Twitter 推文",
            handler=self.search_crypto_twitter
        )
        
        self.register_tool(
            name="get_crypto_reddit",
            description="获取加密项目 Reddit 帖子",
            handler=self.get_crypto_reddit
        )
    
    def collect_crypto_marketing(self, limit: int = 100) -> List[Dict]:
        """收集所有平台的加密项目营销数据"""
        return self.crypto_channel.collect_all(limit)
    
    def search_crypto_twitter(self, query: str, limit: int = 20) -> List[Dict]:
        """搜索 Twitter 加密项目推文"""
        import subprocess
        import json
        
        try:
            r = subprocess.run(
                ["twitter", "search", query, "-n", str(limit)],
                capture_output=True,
                encoding="utf-8",
                timeout=30
            )
            
            if r.returncode == 0:
                return json.loads(r.stdout)
        except:
            pass
        
        return []
    
    def get_crypto_reddit(self, subreddit: str, limit: int = 20) -> List[Dict]:
        """获取 Reddit 加密版块帖子"""
        import subprocess
        import json
        
        try:
            r = subprocess.run(
                ["rdt", "subreddit", subreddit, "--limit", str(limit)],
                capture_output=True,
                encoding="utf-8",
                timeout=30
            )
            
            if r.returncode == 0:
                return json.loads(r.stdout)
        except:
            pass
        
        return []
```

### Phase 4: 集成到现有系统

```typescript
// src/lib/sources/agent-reach-source.ts

import type { SourceAdapter, RawItem, HarvestOptions } from "./base";

export class AgentReachSource implements SourceAdapter {
  name = "agent-reach";
  
  async harvest(opts: HarvestOptions = {}): Promise<RawItem[]> {
    const limit = opts.limit ?? 100;
    
    // 调用 Agent-Reach MCP Server
    const response = await fetch("http://localhost:3001/tools/collect_crypto_marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit })
    });
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      platform: item.platform,
      id: `${item.platform}_${item.post_url}`,
      text: item.post_text,
      url: item.post_url,
      published_at: item.date,
      engagement: item.engagement.likes + item.engagement.comments,
      meta: {
        project_name: item.project_name,
        asset_type: item.asset_type,
        source: item.source
      }
    })) as RawItem[];
  }
}
```

## 🚀 使用方式

### 1. 安装 Agent-Reach

```bash
pip install agent-reach
pip install twitter-cli
pip install rdt-cli
pip install yt-dlp

# 配置 Twitter
export TWITTER_AUTH_TOKEN="your_token"
export TWITTER_CT0="your_ct0"

# 配置 Reddit
rdt login

# 运行诊断
agent-reach doctor
```

### 2. 启动 MCP Server

```bash
cd /workspace/code/ai-intel
python -m agent_reach.integrations.crypto_mcp_server
```

### 3. 在 AI Agent 中使用

告诉你的 AI Agent：

```
帮我收集加密项目营销数据，使用 Agent-Reach
```

Agent 会自动调用 MCP Server 的工具：
- `collect_crypto_marketing` - 收集所有平台数据
- `search_crypto_twitter` - 搜索 Twitter
- `get_crypto_reddit` - 获取 Reddit 帖子

## 📊 输出格式

```json
{
  "platform": "twitter",
  "project_name": "Bitcoin",
  "post_url": "https://x.com/Bitcoin/status/123456",
  "post_text": "Big announcement...",
  "date": "2026-06-05T10:30:00",
  "engagement": {
    "likes": 5000,
    "retweets": 1200,
    "replies": 300
  },
  "asset_type": "Airdrop",
  "source": "agent-reach"
}
```

## ✅ 优势

| 优势 | 说明 |
|------|------|
| **零 API 费用** | 使用开源工具，无需付费 API |
| **真实数据** | 直接从平台获取，无模拟数据 |
| **可插拔架构** | 每个平台独立，可替换上游工具 |
| **MCP 集成** | AI Agent 直接调用 |
| **持续更新** | Agent-Reach 团队维护上游工具 |

## 📋 下一步

1. ✅ 安装 Agent-Reach 和上游工具
2. ⬜ 配置 Twitter 和 Reddit 认证
3. ⬜ 创建加密项目营销 Channel
4. ⬜ 启动 MCP Server
5. ⬜ 集成到现有 AI 情报系统
6. ⬜ 测试并验证