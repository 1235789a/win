# 完整 API Key 获取指南

## 概述
本文档列出所有常用数据爬虫/收集所需的API Key，共计15+个平台。

---

## 1. Twitter/X API

**官网：** https://developer.twitter.com/

**获取步骤：**
1. 登录 Twitter 账号
2. 申请开发者账户：https://developer.twitter.com/en/portal/petition/essential/basic-info
3. 创建项目和应用
4. 在 "Keys and tokens" 页面获取密钥

**需要的密钥（5个）：**
- API Key (Consumer Key)
- API Secret Key (Consumer Secret)
- Access Token
- Access Token Secret
- Bearer Token

**价格：**
- Free: 500,000 推文/月（读取限制）
- Basic: $100/月
- Pro: $499/月
- Enterprise: 定制

---

## 2. Telegram Bot API

**官网：** https://core.telegram.org/bots/api

**获取步骤：**
1. 打开 Telegram
2. 搜索 @BotFather
3. 发送 `/newbot`
4. 按提示设置名称
5. 获得 Bot Token

**需要的密钥（1个）：**
- Bot Token

**价格：** 免费

---

## 3. Discord API

**官网：** https://discord.com/developers/applications

**获取步骤：**
1. 登录 Discord
2. 进入开发者门户
3. 点击 "New Application"
4. 进入 "Bot" 页面
5. 点击 "Add Bot"
6. 点击 "Reset Token" 获取 Token

**需要的密钥（1个）：**
- Bot Token

**价格：** 免费

---

## 4. Medium API

**官网：** https://medium.com/me/settings

**获取步骤：**
1. 登录 Medium
2. 进入设置页面
3. 找到 "Integration tokens"
4. 点击 "Get integration token"

**需要的密钥（1个）：**
- Integration Token

**价格：** 免费

**RSS替代方案：**
- `https://medium.com/feed/@username`（无需API）

---

## 5. Google Custom Search API

**官网：** https://developers.google.com/custom-search/v1/introduction

**获取步骤：**
1. 创建 Google Cloud 项目：https://console.cloud.google.com/
2. 启用 Custom Search API
3. 创建 API Key
4. 创建 Custom Search Engine：https://programmablesearchengine.google.com/
5. 获取 Search Engine ID

**需要的密钥（2个）：**
- API Key
- Search Engine ID (cx)

**价格：**
- 免费: 100 次搜索/天
- 付费: $5/1000次搜索（最多10,000次/天）

---

## 6. Reddit API

**官网：** https://www.reddit.com/prefs/apps

**获取步骤：**
1. 登录 Reddit
2. 进入 https://www.reddit.com/prefs/apps
3. 点击 "create another app..."
4. 选择 "script" 类型
5. 填写信息后获取密钥

**需要的密钥（3个）：**
- Client ID
- Client Secret
- User Agent（自定义字符串）

**价格：** 免费（有速率限制）

---

## 7. YouTube Data API

**官网：** https://console.cloud.google.com/apis/library/youtube.googleapis.com

**获取步骤：**
1. 创建 Google Cloud 项目
2. 启用 YouTube Data API v3
3. 创建 API Key 或 OAuth 2.0 凭据

**需要的密钥（1个）：**
- API Key

**价格：**
- 免费: 10,000 单位/天
- 付费: 按使用量计费

---

## 8. CoinGecko API

**官网：** https://www.coingecko.com/en/api

**获取步骤：**
1. 注册 CoinGecko 账号
2. 进入 API 页面
3. 选择套餐
4. 获取 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- Demo: 免费（10-50次/分钟）
- Analyst: $129/月
- Pro: $499/月

---

## 9. CoinMarketCap API

**官网：** https://coinmarketcap.com/api/

**获取步骤：**
1. 注册 CoinMarketCap 账号
2. 进入 API 页面
3. 申请 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- Basic: 免费（10,000次/月）
- Hobbyist: $29/月
- Startup: $79/月
- Standard: $149/月

---

## 10. GitHub API

**官网：** https://github.com/settings/tokens

**获取步骤：**
1. 登录 GitHub
2. 进入 Settings → Developer settings → Personal access tokens
3. 点击 "Generate new token"
4. 选择权限范围
5. 生成 Token

**需要的密钥（1个）：**
- Personal Access Token

**价格：** 免费（有速率限制：5000次/小时）

---

## 11. News API

**官网：** https://newsapi.org/

**获取步骤：**
1. 注册 News API 账号
2. 进入 https://newsapi.org/register
3. 获取 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- Developer: 免费（100篇文章/天，仅开发用）
- Business: $449/月

---

## 12. Instagram Graph API

**官网：** https://developers.facebook.com/docs/instagram-api

**获取步骤：**
1. 创建 Facebook 开发者账号
2. 创建应用
3. 添加 Instagram Graph API 产品
4. 获取 Access Token

**需要的密钥（2个）：**
- App ID
- App Secret
- Access Token

**价格：** 免费（需要商业账号验证）

---

## 13. LinkedIn API

**官网：** https://www.linkedin.com/developers/

**获取步骤：**
1. 创建 LinkedIn 开发者账号
2. 创建应用
3. 获取 Client ID 和 Client Secret

**需要的密钥（2个）：**
- Client ID
- Client Secret

**价格：** 免费（需要审核）

---

## 14. Hacker News API

**官网：** https://github.com/HackerNews/API

**获取步骤：** 无需API Key

**价格：** 完全免费，公开API

---

## 15. Product Hunt API

**官网：** https://www.producthunt.com/api/v2/docs

**获取步骤：**
1. 注册 Product Hunt 账号
2. 创建 API 应用
3. 获取 Client ID 和 Client Secret

**需要的密钥（2个）：**
- Client ID
- Client Secret

**价格：** 免费

---

## 16. Notion API

**官网：** https://developers.notion.com/

**获取步骤：**
1. 创建 Notion 集成：https://www.notion.so/my-integrations
2. 获取 Internal Integration Token

**需要的密钥（1个）：**
- Integration Token (Secret)

**价格：** 免费

---

## 17. Slack API

**官网：** https://api.slack.com/

**获取步骤：**
1. 创建 Slack 应用：https://api.slack.com/apps
2. 获取 Bot User OAuth Token

**需要的密钥（1个）：**
- Bot User OAuth Token (xoxb-...)

**价格：** 免费

---

## 18. OpenAI API

**官网：** https://platform.openai.com/

**获取步骤：**
1. 注册 OpenAI 账号
2. 进入 https://platform.openai.com/api-keys
3. 创建 API Key

**需要的密钥（1个）：**
- API Key (sk-...)

**价格：**
- 按使用量付费
- GPT-4: $0.03/1K tokens
- GPT-3.5: $0.002/1K tokens

---

## 19. Anthropic Claude API

**官网：** https://console.anthropic.com/

**获取步骤：**
1. 注册 Anthropic 账号
2. 进入控制台
3. 创建 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- Claude 3.5 Sonnet: $3/1M input tokens
- Claude 3 Haiku: $0.25/1M input tokens

---

## 20. DeepSeek API

**官网：** https://platform.deepseek.com/

**获取步骤：**
1. 注册 DeepSeek 账号
2. 进入 https://platform.deepseek.com/api_keys
3. 创建 API Key

**需要的密钥（1个）：**
- API Key (sk-...)

**价格：**
- DeepSeek-V3: $0.27/1M tokens
- DeepSeek-Reasoner: $0.55/1M tokens

---

## 21. Binance API

**官网：** https://www.binance.com/en/my/settings/api-management

**获取步骤：**
1. 登录 Binance
2. 进入 API Management
3. 创建 API Key

**需要的密钥（2个）：**
- API Key
- Secret Key

**价格：** 免费

---

## 22. Unsplash API

**官网：** https://unsplash.com/developers

**获取步骤：**
1. 注册 Unsplash 开发者账号
2. 创建应用
3. 获取 Access Token

**需要的密钥（1个）：**
- Access Token

**价格：** 免费（50次/小时）

---

## 23. Spotify API

**官网：** https://developer.spotify.com/

**获取步骤：**
1. 登录 Spotify
2. 进入 Dashboard
3. 创建应用
4. 获取 Client ID 和 Client Secret

**需要的密钥（2个）：**
- Client ID
- Client Secret

**价格：** 免费

---

## 24. Twitch API

**官网：** https://dev.twitch.tv/

**获取步骤：**
1. 注册 Twitch 开发者账号
2. 创建应用
3. 获取 Client ID 和 Client Secret

**需要的密钥（2个）：**
- Client ID
- Client Secret

**价格：** 免费

---

## 25. Weather API (OpenWeatherMap)

**官网：** https://openweathermap.org/api

**获取步骤：**
1. 注册账号
2. 获取 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- 免费: 60次/分钟
- 付费: 根据套餐

---

## 26. IP Geolocation API

**官网：** https://ip-api.com/

**获取步骤：**
- 免费版无需API Key
- Pro版需要注册获取API Key

**价格：**
- 免费: 45次/分钟
- Pro: $13/月

---

## 27. SerpAPI (搜索引擎结果API)

**官网：** https://serpapi.com/

**获取步骤：**
1. 注册账号
2. 获取 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- 免费: 100次/月
- 入门: $50/月（5000次）
- 基本: $100/月（15,000次）

---

## 28. ScrapingBee API (网页爬虫)

**官网：** https://www.scrapingbee.com/

**获取步骤：**
1. 注册账号
2. 获取 API Key

**需要的密钥（1个）：**
- API Key

**价格：**
- 免费: 1000次/月
- 入门: $49/月
- 基本: $99/月

---

## 29. Bright Data API (代理服务)

**官网：** https://brightdata.com/

**获取步骤：**
1. 注册账号
2. 获取 API Token

**需要的密钥（1个）：**
- API Token

**价格：**
- 按使用量付费
- 住宅代理: $12.5/GB

---

## 30. Apify API (爬虫平台)

**官网：** https://apify.com/

**获取步骤：**
1. 注册账号
2. 获取 API Token

**需要的密钥（1个）：**
- API Token

**价格：**
- 免费: $5/月额度
- 付费: 按使用量

---

## API Key 总览表

| 序号 | 平台 | 密钥数量 | 价格 | 用途 |
|------|------|---------|------|------|
| 1 | Twitter/X | 5 | 免费-$499 | 社交媒体数据 |
| 2 | Telegram | 1 | 免费 | 社交媒体数据 |
| 3 | Discord | 1 | 免费 | 社交媒体数据 |
| 4 | Medium | 1 | 免费 | 博客文章 |
| 5 | Google Search | 2 | 免费-$5/千次 | 搜索引擎 |
| 6 | Reddit | 3 | 免费 | 社交媒体数据 |
| 7 | YouTube | 1 | 免费 | 视频数据 |
| 8 | CoinGecko | 1 | 免费-$499 | 加密货币数据 |
| 9 | CoinMarketCap | 1 | 免费-$149 | 加密货币数据 |
| 10 | GitHub | 1 | 免费 | 代码数据 |
| 11 | News API | 1 | 免费-$449 | 新闻数据 |
| 12 | Instagram | 3 | 免费 | 社交媒体数据 |
| 13 | LinkedIn | 2 | 免费 | 社交媒体数据 |
| 14 | Hacker News | 0 | 免费 | 科技新闻 |
| 15 | Product Hunt | 2 | 免费 | 产品数据 |
| 16 | Notion | 1 | 免费 | 文档数据 |
| 17 | Slack | 1 | 免费 | 社交数据 |
| 18 | OpenAI | 1 | 按量付费 | AI处理 |
| 19 | Anthropic | 1 | 按量付费 | AI处理 |
| 20 | DeepSeek | 1 | 按量付费 | AI处理 |
| 21 | Binance | 2 | 免费 | 交易所数据 |
| 22 | Unsplash | 1 | 免费 | 图片数据 |
| 23 | Spotify | 2 | 免费 | 音乐数据 |
| 24 | Twitch | 2 | 免费 | 直播数据 |
| 25 | Weather | 1 | 免费 | 天气数据 |
| 26 | IP Geo | 0-1 | 免费-$13 | 地理数据 |
| 27 | SerpAPI | 1 | 免费-$100 | 搜索结果 |
| 28 | ScrapingBee | 1 | 免费-$99 | 网页爬取 |
| 29 | Bright Data | 1 | 按量付费 | 代理服务 |
| 30 | Apify | 1 | 免费 | 爬虫平台 |

---

## 免费方案推荐（加密项目营销数据收集）

**必备（免费）：**
1. Twitter/X Free Tier - 500,000推文/月
2. Telegram Bot API - 免费
3. Discord Bot API - 免费
4. CoinGecko Demo API - 免费
5. CoinMarketCap Basic API - 免费（10,000次/月）
6. Reddit API - 免费
7. Hacker News API - 免费

**可选（免费）：**
8. Medium RSS - 免费（无需API）
9. GitHub API - 免费
10. Product Hunt API - 免费

**总成本：$0/月**

---

## 付费方案推荐

**基础方案（$100以内）：**
- Twitter Basic: $100/月
- CoinGecko Analyst: $129/月
- SerpAPI Starter: $50/月

**专业方案（$500以内）：**
- Twitter Pro: $499/月
- CoinGecko Pro: $499/月
- ScrapingBee Basic: $99/月
- Bright Data: 按量付费

---

## 安全提示

⚠️ **重要安全规则：**
1. 不要将API Key提交到Git仓库
2. 使用环境变量存储密钥
3. 定期更换密钥
4. 设置API使用限制
5. 监控API使用量
6. 使用密钥管理服务（如AWS Secrets Manager）

---

## 下一步

1. 根据需求选择需要的API
2. 按照各平台步骤获取密钥
3. 将密钥保存到 `.env` 文件
4. 开始数据收集