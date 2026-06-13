"""
RSS 爬虫：抓主要加密媒体的 RSS  feedparser
输出统一格式，asset_type 按关键词分类。
"""

import time
import feedparser
from datetime import datetime
from typing import List, Dict
from bs4 import BeautifulSoup  # 清理 HTML 正文

from crawler.reddit_crawler import classify  # 复用关键词分类


RSS_FEEDS = [
    {"name": "CoinDesk", "url": "https://feeds.feedburner.com/CoinDesk"},
    {"name": "Cointelegraph", "url": "https://cointelegraph.com/rss"},
    {"name": "NewsBTC", "url": "https://www.newsbtc.com/feed"},
    {"name": "CryptoPotato", "url": "https://cryptopotato.com/feed"},
    {"name": "CryptoSlate", "url": "https://cryptoslate.com/feed"},
    {"name": "Bitcoin Magazine", "url": "https://bitcoinmagazine.com/feed"},
    {"name": "Decrypt", "url": "https://decrypt.co/feed"},
    {"name": "The Block", "url": "https://www.theblock.co/rss"},
]


def strip_html(html: str) -> str:
    if not html:
        return ""
    try:
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator=" ", strip=True)
    except Exception:
        return html


def parse_entry(entry: Dict, feed_name: str) -> Dict:
    title = entry.get("title", "") or ""
    summary = entry.get("summary", "") or entry.get("description", "") or ""
    content = strip_html(summary)
    link = entry.get("link", "") or ""

    # 解析时间
    published_str = ""
    for key in ("published", "updated", "pubDate"):
        if entry.get(key):
            parsed = entry.get(key_parsed)  # type: ignore
            # feedparser 会生成 .published_parsed / .updated_parsed struct_time
            break
    try:
        t = entry.get("published_parsed") or entry.get("updated_parsed")
        if t:
            published_dt = datetime(*t[:6])
            published_str = published_dt.isoformat()
        else:
            published_str = datetime.utcnow().isoformat()
    except Exception:
        published_str = datetime.utcnow().isoformat()

    post_text = title
    if content:
        post_text = title + "\n" + content[:800]

    asset_type = classify(title, content)

    return {
        "platform": "rss",
        "project_name": feed_name,
        "project_url": entry.get("feed", {}).get("href", ""),
        "post_url": link,
        "image_url": "",
        "post_text": post_text,
        "asset_type": asset_type,
        "engagement": {"likes": 0, "comments": 0, "views": 0},
        "date": published_str,
        "source": f"rss:{feed_name}",
    }


def crawl(limit_per_feed: int = 15) -> List[Dict]:
    all_posts: List[Dict] = []
    print(f"[RSS] 开始抓取，目标 {len(RSS_FEEDS)} 个 feed")

    for feed in RSS_FEEDS:
        name = feed["name"]
        url = feed["url"]
        try:
            parsed = feedparser.parse(url)
            entries = parsed.entries[:limit_per_feed]
            added = 0
            for e in entries:
                if not e.get("link"):
                    continue
                all_posts.append(parse_entry(e, name))
                added += 1
            print(f"  {name}: +{added} 条")
        except Exception as ex:
            print(f"  {name}: 异常 {ex}")
        time.sleep(0.5)

    print(f"[RSS] 合计 {len(all_posts)} 条")
    return all_posts


if __name__ == "__main__":
    posts = crawl(limit_per_feed=10)
    by_type: Dict[str, int] = {}
    for p in posts:
        t = p.get("asset_type", "Other")
        by_type[t] = by_type.get(t, 0) + 1
    print("按类型:", by_type)
    for p in posts[:5]:
        print(f"  [{p['asset_type']}] {p['project_name']} - {p['post_text'][:80]}")
