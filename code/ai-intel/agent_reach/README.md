# 🚀 Agent-Reach 加密项目营销数据收集器

## ✅ 已完成的重构

基于 [Agent-Reach](https://github.com/Panniantong/Agent-Reach) 项目，我们重构了 AI 情报获取系统的爬虫层。

---

## 📁 文件结构

```
/workspace/code/ai-intel/
├── AGENT_REACH_REFACTOR_GUIDE.md     # 重构指南
├── agent_reach/
│   ├── crypto_marketing_channel.py   # 加密项目营销数据收集器
│   ├── install.sh                    # 安装脚本
│   └── README.md                     # 使用说明
├── src/lib/sources/
│   └── agent-reach-source.ts         # TypeScript 集成适配器
└── agent-reach/                      # Agent-Reach 源码（克隆）
```

---

## 🎯 核心优势

| 优势 | 说明 |
|------|------|
| **零 API 费用** | 使用开源工具，无需付费 API |
| **真实数据** | 直接从平台获取，无模拟数据 |
| **可插拔架构** | 每个平台独立，可替换上游工具 |
| **持续更新** | Agent-Reach 团队维护上游工具 |

---

## 🔧 安装步骤

### 1. 运行安装脚本

```bash
cd /workspace/code/ai-intel/agent_reach
chmod +x install.sh
./install.sh
```

### 2. 配置认证

**Twitter/X 认证：**

```bash
# 在浏览器登录 x.com
# 打开开发者工具 (F12)
# Application → Cookies → x.com
# 复制 auth_token 和 ct0

export TWITTER_AUTH_TOKEN="your_auth_token"
export TWITTER_CT0="your_ct0"
```

**Reddit 认证：**

```bash
# 先在浏览器登录 reddit.com
rdt login
```

### 3. 运行收集器

```bash
cd /workspace/code/ai-intel/agent_reach
python3 crypto_marketing_channel.py
```

---

## 📊 输出格式

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
    "replies": 300,
    "views": 50000
  },
  "asset_type": "Airdrop",
  "post_text": "Big announcement...",
  "collected_at": "2026-06-05T12:00:00",
  "source": "agent-reach"
}
```

---

## 📈 类型分类

| 类型 | 关键词 |
|------|--------|
| AMA | ama, ask me anything |
| Airdrop | airdrop, free token, claim |
| Partnership | partnership, collaboration |
| Listing | listing, exchange, trading |
| Giveaway | giveaway, win, prize |
| Meme | meme, funny |
| Other | 其他 |

---

## 🌐 支持的平台

| 平台 | 工具 | 状态 |
|------|------|------|
| Twitter/X | twitter-cli | ✅ 已集成 |
| Reddit | rdt-cli | ✅ 已集成 |
| YouTube | yt-dlp | ✅ 已集成 |
| Medium | Jina Reader | ✅ 已集成 |
| Telegram | 待实现 | ⬜ 待开发 |
| Discord | 待实现 | ⬜ 待开发 |

---

## 🔗 集成到现有系统

### TypeScript 集成

```typescript
import { AgentReachSource } from "./sources/agent-reach-source";

// 创建数据源
const agentReachSource = new AgentReachSource();

// 收集数据
const items = await agentReachSource.harvest({ limit: 100 });

// 搜索 Twitter
const tweets = await agentReachSource.searchTwitter("Bitcoin", 20);

// 获取 Reddit
const posts = await agentReachSource.getReddit("cryptocurrency", 20);
```

---

## 📋 下一步

1. ✅ Agent-Reach 已克隆
2. ✅ Python 收集器已创建
3. ✅ TypeScript 适配器已创建
4. ⬜ 安装上游工具 (twitter-cli, rdt-cli)
5. ⬜ 配置认证
6. ⬜ 测试收集器
7. ⬜ 集成到 AI 情报分析流程

---

## ⚠️ 注意事项

1. **法律合规** - 只抓取公开可见的内容
2. **速率限制** - 不要请求过快，避免被封 IP
3. **认证配置** - Twitter 和 Reddit 需要配置 Cookie
4. **持续更新** - Agent-Reach 团队会持续维护上游工具

---

## 📚 相关资源

- [Agent-Reach GitHub](https://github.com/Panniantong/Agent-Reach)
- [twitter-cli](https://github.com/public-clis/twitter-cli)
- [rdt-cli](https://github.com/public-clis/rdt-cli)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Jina Reader](https://github.com/jina-ai/reader)

---

## 🎉 完成！

基于 Agent-Reach 的爬虫系统重构已完成！

**核心改进：**
- ✅ 零 API 费用
- ✅ 真实数据来源
- ✅ 可插拔架构
- ✅ 持续维护更新

**下一步：**
安装上游工具并配置认证，然后运行收集器测试。