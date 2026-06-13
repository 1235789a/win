"""
Reddit 爬虫：用公开 JSON 接口，不需要任何 API key。
- 直接请求 https://www.reddit.com/r/<subreddit>/hot.json
- 用 Reddit 自己的接口字段做关键词匹配
- 输出统一格式：platform, project_name, post_url, post_text, asset_type, engagement, date
"""

import time
import requests
from datetime import datetime
from typing import List, Dict, Set, Optional


SUBREDDITS = [
    "CryptoCurrency",
    "CryptoMarkets",
    "Bitcoin",
    "ethereum",
    "solana",
    "altcoin",
    "defi",
    "NFT",
]

KEYWORDS_FOR_AIRDROPS = {"airdrop", "air drop", "claim", "free token", "free mint", "giveaway", "whitelist"}
KEYWORDS_FOR_LISTING = {"list", "listing", "launch", "on board", "new token", "debut"}
KEYWORDS_FOR_PARTNERSHIP = {"partnership", "partner", "collaboration", "integrate", "merge", "acquire"}
KEYWORDS_FOR_AMA = {"ama", "ask me anything", "ask me", "live q&a", "q & a", "space", "spaces"}
KEYWORDS_FOR_MEME = {"meme", "memecoin", "memecoin", "shitcoin", "dogwifhat", "pepe", "dogecoin", "bonk", "floki"}


USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " \
             "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def classify(title: str, selftext: str) -> str:
    text = (title + " " + (selftext or "")).lower()
    if any(k in text for k in KEYWORDS_FOR_AMA):
        return "AMA"
    if any(k in text for k in KEYWORDS_FOR_AIROPS):
        return "Airdrop"
    if any(k in text for k in KEYWORDS_FOR_PARTNERSHIP):
        return "Partnership"
    if any(k in text for k in KEYWORDS_FOR_LISTING):
        return "Listing"
    if any(k in text for k in KEYWORDS_FOR_MEME):
        return "Meme"
    return "Other"


KEYWORDS_FOR_AIROPS = KEYWORDS_FOR_AIRDROPS  # 兼容命名


def fetch_subreddit(subreddit: str, limit: int = 20) -> List[Dict]:
    """抓一个 subreddit 的热帖，返回统一格式的列表。"""
    url = f"https://www.reddit.com/r/{subreddit}/hot.json"
    params = {"limit": limit}
    try:
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        if r.status_code != 200:
            print(f"  [Reddit] r/{subreddit} HTTP {r.status_code}")
            return []
        data = r.json().get("data", {}).get("children", [])
    except Exception as e:
        print(f"  [Reddit] r/{subreddit} 异常: {e}")
        return []

    results = []
    for item in data:
        d = item.get("data", {})
        title = d.get("title", "")
        selftext = d.get("selftext", "")
        permalink = d.get("permalink", "")
        post_url = f"https://reddit.com{permalink}"
        published_dt = datetime.utcfromtimestamp(d.get("created_utc", 0)) if d.get("created_utc") else datetime.utcnow()
        asset_type = classify(title, selftext)

        results.append({
            "platform": "reddit",
            "project_name": f"r/{subreddit}",
            "project_url": f"https://reddit.com/r/{subreddit}",
            "post_url": post_url,
            "image_url": d.get("thumbnail") or d.get("url", ""),
            "post_text": title,
            "asset_type": asset_type,
            "engagement": {
                "likes": d.get("score", 0) or 0,
                "comments": d.get("num_comments", 0) or 0,
                "views": 0,
            },
            "date": published_dt.isoformat(),
            "source": "reddit-json",
        })
    return results


def crawl(limit_per_source: int = 20) -> List[Dict]:
    all_posts: List[Dict] = []
    seen_urls: Set[str] = set()

    print("[Reddit] 开始抓取，目标 subreddits:", SUBREDDITS)
    for sr in SUBREDDITS:
        posts = fetch_subreddit(sr, limit=limit_per_source)
        added = 0
        for p in posts:
            if p["post_url"] in seen_urls:
                continue
            seen_urls.add(p["post_url"])
            all_posts.append(p)
            added += 1
        print(f"  r/{sr}: +{added} 条")
        time.sleep(1.0)  # 礼貌限速
    print(f"[Reddit] 合计 {len(all_posts)} 条")
    return all_posts


if __name__ == "__main__":
    posts = crawl(limit_per_source=15)
    by_type: Dict[str, int] = {}
    for p in posts:
        t = p.get("asset_type", "Other")
        by_type[t] = by_type.get(t, 0) + 1
    print("按资产类型统计:", by_type)
    for p in posts[:5]:
        print(f"  [{p['asset_type']}] {p['post_text'][:80]} -> {p['post_url']}")
