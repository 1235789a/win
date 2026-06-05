# Scrapling 爬虫 - 使用指南

## 快速开始

### 1. 安装依赖

```bash
# 安装 Scrapling
pip install scrapling

# 安装浏览器（可选，但推荐）
scrapling install
```

### 2. 运行爬虫

```bash
# 进入爬虫目录
cd /workspace/code/ai-intel/scrapers

# 测试 Twitter 爬虫
python twitter_scraper.py

# 测试 Reddit 爬虫
python reddit_scraper.py

# 运行完整收集器
python collector.py
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `twitter_scraper.py` | Twitter/X 爬虫 |
| `reddit_scraper.py` | Reddit 爬虫 |
| `collector.py` | 统一收集器 |

## 数据格式

输出数据统一格式：

```json
{
  "platform": "twitter",
  "project_name": "bitcoin",
  "project_url": "https://x.com/bitcoin",
  "post_url": "https://x.com/bitcoin/status/123456",
  "image_url": "https://pbs.twimg.com/media/xxx.jpg",
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
  "source": "scrapling"
}
```

## 资产类型分类

| 类型 | 关键词 |
|------|--------|
| AMA | ama, ask me anything |
| Airdrop | airdrop, giveaway, free, claim |
| Partnership | partnership, collaboration |
| Listing | listing, exchange, trading |
| Giveaway | giveaway, win, prize |
| Meme | meme, funny |
| Other | 其他 |

## 故障排除

### 问题1: Cloudflare 拦截

```python
# 使用 StealthFetcher
with StealthFetcher(solve_cloudflare=True) as fetcher:
    page = fetcher.fetch(url)
```

### 问题2: JavaScript 未加载

```python
# 使用 DynamicFetcher
with DynamicFetcher() as fetcher:
    page = fetcher.fetch(url)
    await page.wait_for_selector('.element')
```

### 问题3: 请求过快被限流

```python
# 添加延迟
import asyncio
await asyncio.sleep(2)  # 2秒延迟
```

### 问题4: 需要登录才能查看

Scrapling 只能抓取公开可见的内容。如果需要登录内容，请使用官方 API。

## 扩展爬虫

参考现有爬虫实现，可以添加更多平台：

- Telegram: 抓取公开频道
- Medium: 抓取博客文章
- Discord: 抓取公开服务器（需要 Bot Token）

## 注意事项

⚠️ **法律合规**
- 只抓取公开可见的内容
- 遵守 robots.txt
- 不要过度频繁请求
- 尊重平台服务条款

⚠️ **反爬风险**
- 网站可能随时更改结构
- 使用代理池避免 IP 被封
- 遵守速率限制