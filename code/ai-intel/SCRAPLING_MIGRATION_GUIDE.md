# AI 情报获取系统 - Scrapling 改造方案

## 改造目标

基于 Scrapling 重构现有数据收集层，实现：
1. **无需 API Key** - 直接抓取公开页面
2. **更稳定的数据收集** - 自动绕过反爬机制
3. **更丰富的数据类型** - 获取图片、完整互动数据
4. **MCP 集成** - 与 AI 系统无缝对接

## 架构设计

```
┌─────────────────────────────────────────────┐
│           AI 情报分析层                      │
│  (现有 two-step-analyze.ts)                │
└─────────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────────┐
│        Scrapling 统一爬虫层（新）           │
│  - StealthFetcher: 绕过反爬                │
│  - DynamicFetcher: 动态页面渲染             │
│  - 自适应解析: 网站改版自动修复              │
└─────────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────────┐
│     平台适配器（改造现有 SourceAdapter）    │
│  - TwitterScraper (替代 Nitter)            │
│  - RedditScraper (增强现有)                │
│  - TelegramScraper (新增)                  │
│  - DiscordScraper (新增)                   │
│  - MediumScraper (新增)                    │
└─────────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────────┐
│          数据存储层                          │
│  (现有 SQLite + 增强)                       │
└─────────────────────────────────────────────┘
```

## 技术选型

### Scrapling 核心组件

| 组件 | 用途 | 场景 |
|------|------|------|
| **StealthFetcher** | 反反爬爬虫 | Twitter/X, Reddit 等有反爬的站点 |
| **DynamicFetcher** | 动态页面 | JavaScript 渲染的页面 |
| **Fetcher** | 轻量级 | 静态页面快速抓取 |
| **Spider Framework** | 分布式爬虫 | 大规模数据收集 |

### 依赖安装

```bash
# 在 ai-intel 项目中安装
cd /workspace/code/ai-intel
npm install scrapling

# 或使用 Python 版本（如果需要）
pip install scrapling
```

## 改造步骤

### Phase 1: 基础爬虫适配器

#### 1. Twitter/X 爬虫（替代 Nitter）

```typescript
// src/lib/scrapers/twitter-scraper.ts
import { StealthFetcher } from 'scrapling';

export class TwitterScraper {
  private fetcher: any;
  
  constructor() {
    this.fetcher = new StealthFetcher({ solve_cloudflare: true });
  }
  
  async getProfile(username: string) {
    // 抓取用户资料页
    const page = await this.fcher.fetch(`https://x.com/${username}`);
    
    // 提取推文
    const tweets = page.css('[data-testid="tweet"]');
    
    return tweets.map(tweet => ({
      text: tweet.css('[data-testid="tweetText"]::text').all().join(' '),
      date: tweet.css('time').att('datetime'),
      likes: tweet.css('[data-testid="like"]::text').first(),
      retweets: tweet.css('[data-testid="retweet"]::text').first(),
      url: tweet.css('a[href*="/status/"]').att('href'),
    }));
  }
  
  async search(query: string, limit = 20) {
    const page = await this.fetcher.fetch(
      `https://x.com/search?q=${encodeURIComponent(query)}&f=live`
    );
    
    // 等待推文加载
    await page.wait_for_selector('[data-testid="tweet"]', { timeout: 5000 });
    
    return this.extractTweets(page, limit);
  }
}
```

#### 2. Reddit 增强爬虫

```typescript
// src/lib/scrapers/reddit-scraper.ts
import { DynamicFetcher } from 'scrapling';

export class RedditScraper {
  private fetcher: any;
  
  async getSubredditPosts(subreddit: string, sort = 'hot') {
    const page = await this.fetcher.fetch(
      `https://www.reddit.com/r/${subreddit}/${sort}/`
    );
    
    // 等待帖子加载
    await page.wait_for_selector('[data-testid="post-container"]');
    
    const posts = page.css('[data-testid="post-container"]');
    
    return posts.map(post => ({
      title: post.css('h3::text').first(),
      text: post.css('[data-click-id="body"] p::text').all().join(' '),
      score: post.css('[data-testid="vote-arrows"]::text').first(),
      comments: post.css('a[data-click-id="comments"]::text').first(),
      url: post.css('a[data-click-id="comments"]').att('href'),
      date: post.css('a[data-click-id="timestamp"]').att('href'),
      image: post.css('img').att('src'),
    }));
  }
}
```

#### 3. Telegram 频道爬虫

```typescript
// src/lib/scrapers/telegram-scraper.ts
import { StealthFetcher } from 'scrapling';

export class TelegramScraper {
  private fetcher: any;
  
  async getChannelPosts(channelUsername: string, limit = 50) {
    // 使用 t.me 公开页面
    const page = await this.fetcher.fetch(
      `https://t.me/s/${channelUsername}`
    );
    
    const messages = page.css('.tgme_channel_info .tgme_message');
    
    return messages.slice(0, limit).map(msg => ({
      text: msg.css('.tgme_message_text').text(),
      date: msg.css('.tgme_message_datetime').att('datetime'),
      views: msg.css('.tgme_message_view_count').text(),
      forwards: msg.css('.tgme_message_forward_count').text(),
      url: msg.css('.tgme_message_date').att('href'),
    }));
  }
}
```

### Phase 2: 自适应解析器

Scrapling 的核心优势：**网站改版自动修复**

```typescript
// src/lib/scrapers/adaptive-parser.ts
import { AdaptiveParser } from 'scrapling';

export class AdaptiveTweetParser {
  private parser: any;
  
  constructor() {
    this.parser = new AdaptiveParser();
  }
  
  // 首次抓取时保存元素特征
  async saveTweetSignatures(page: any) {
    const tweets = page.css('[data-testid="tweet"]');
    
    for (let i = 0; i < tweets.length; i++) {
      // 保存元素特征到数据库
      await this.saveElementSignature({
        url: page.url,
        selector: `[data-testid="tweet"]:nth-child(${i + 1})`,
        element: tweets[i],
      });
    }
  }
  
  // 网站改版后自动重定位
  async adaptivelyParse(page: any) {
    const tweets = page.css('[data-testid="tweet"]', { adaptive: true });
    
    return tweets.map(tweet => ({
      text: tweet.css('[data-testid="tweetText"]::text').all().join(' '),
      date: tweet.css('time').att('datetime'),
    }));
  }
}
```

### Phase 3: MCP Server 集成

Scrapling 支持 MCP 协议，可与 AI 直接集成：

```typescript
// src/lib/mcp/scrapling-mcp.ts
import { createMCPServer } from 'scrapling/ai/mcp-server';

// 创建 MCP Server
const server = createMCPServer({
  port: 3001,
  scrapers: {
    twitter: new TwitterScraper(),
    reddit: new RedditScraper(),
    telegram: new TelegramScraper(),
  },
});

server.start();
```

现在 AI 可以直接调用：
- `scrape_twitter(profile="username")`
- `scrape_reddit(subreddit="cryptocurrency")`
- `scrape_telegram(channel="channel_name")`

## 数据格式

统一输出格式：

```typescript
interface ScrapedContent {
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord' | 'medium' | 'blog';
  project_name: string;
  project_url: string;
  post_url: string;
  image_url?: string;
  date: string;
  engagement: {
    likes?: number;
    retweets?: number;
    comments?: number;
    views?: number;
    forwards?: number;
  };
  asset_type: 'AMA' | 'Airdrop' | 'Partnership' | 'Listing' | 'Giveaway' | 'Meme' | 'Other';
  post_text: string;
  raw_html?: string;
  collected_at: string;
  source: 'scrapling';
}
```

## 部署方案

### 开发环境

```bash
# 安装依赖
npm install scrapling

# 运行测试
npx ts-node src/lib/scrapers/test-twitter.ts
```

### 生产环境

1. **使用 Docker**
```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y chromium
RUN npm install -g scrapling
```

2. **配置反爬绕过**
```typescript
const fetcher = new StealthFetcher({
  solve_cloudflare: true,
  solve_turnstile: true,
  stealth: true,
});
```

3. **设置代理轮换**
```typescript
const fetcher = new StealthFetcher({
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    auth: { username: 'user', password: 'pass' },
  },
});
```

## 改造优先级

| 阶段 | 任务 | 工作量 | 价值 |
|------|------|--------|------|
| P0 | Twitter 爬虫 | 2天 | ⭐⭐⭐⭐⭐ |
| P0 | Reddit 增强 | 1天 | ⭐⭐⭐⭐ |
| P1 | Telegram 爬虫 | 2天 | ⭐⭐⭐⭐ |
| P1 | Medium 爬虫 | 1天 | ⭐⭐⭐ |
| P2 | Discord 爬虫 | 3天 | ⭐⭐⭐ |
| P2 | MCP Server | 2天 | ⭐⭐⭐⭐⭐ |

## 下一步

1. ✅ 确认改造方案
2. ⬜ 安装 Scrapling
3. ⬜ 开发 Twitter 爬虫适配器
4. ⬜ 测试并集成到现有系统
5. ⬜ 扩展其他平台

## 注意事项

⚠️ **法律合规**：
- 只抓取公开可见的内容
- 遵守 robots.txt
- 不要过度频繁请求
- 尊重平台服务条款

⚠️ **技术限制**：
- 需要真实浏览器环境
- 反爬机制可能失效
- 大规模抓取需要代理池