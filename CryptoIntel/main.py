"""
CryptoIntel 统一入口 main.py

用法：
  python main.py crawl       # 只抓数据
  python main.py analyze     # 对数据库里未分析的帖子进行 DeepSeek 评分
  python main.py run         # 先抓再分析 = 完整流程
  python main.py list        # 列出机会报告
  python main.py show        # 显示最新 30 条帖子的简短统计

环境变量:
  ./.env  -> DEEPSEEK_API_KEY, FETCH_LIMIT_PER_SOURCE, DB_PATH
"""

import os
import sys
import json
from datetime import datetime
from typing import List, Dict

# 让 Python 能 import crawler / analyzer / storage
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from crawler import reddit_crawler, rss_crawler
from analyzer import deepseek_scorer
from storage import db


def _load_env():
    env_path = os.path.join(BASE_DIR, ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env()

DB_PATH = os.environ.get("DB_PATH", os.path.join(BASE_DIR, "data", "cryptointel.db"))
FETCH_LIMIT = int(os.environ.get("FETCH_LIMIT_PER_SOURCE", "25"))


def cmd_crawl() -> int:
    print("=" * 60)
    print(f"[1/3] 抓取数据   DB: {DB_PATH}")
    print("=" * 60)
    db.init_db(DB_PATH)

    reddit_posts = reddit_crawler.crawl(limit_per_source=FETCH_LIMIT)
    rss_posts = rss_crawler.crawl(limit_per_feed=FETCH_LIMIT)

    all_posts = reddit_posts + rss_posts
    inserted = 0
    for p in all_posts:
        pid = db.upsert_post(p, DB_PATH)
        if pid:
            inserted += 1

    print(f"\n总计抓取 {len(all_posts)} 条，新存入 {inserted} 条（其余为重复 URL 已跳过）")
    print(f"当前数据库帖子总数: {db.count_posts(DB_PATH)}")
    return inserted


def cmd_analyze(limit: int = 50) -> int:
    print("=" * 60)
    print(f"[2/3] DeepSeek 评分   DB: {DB_PATH}")
    print("=" * 60)
    db.init_db(DB_PATH)

    posts = db.list_posts(limit=limit, db_path=DB_PATH)
    if not posts:
        print("数据库里还没有帖子，先运行: python main.py crawl")
        return 0

    # 去重：同一条 post 只分析一次（按 post_url 不重复）
    analyzed_posts: List[Dict] = []
    seen_urls = set()
    for p in posts:
        if p["post_url"] in seen_urls:
            continue
        seen_urls.add(p["post_url"])
        analyzed_posts.append({
            "_post_id": p["id"],
            "platform": p["platform"],
            "project_name": p["project_name"],
            "post_url": p["post_url"],
            "post_text": p["post_text"] or "",
            "asset_type": p["asset_type"] or "Other",
            "engagement": {
                "likes": p["likes"] or 0,
                "comments": p["comments"] or 0,
                "views": p["views"] or 0,
            },
            "date": p["published_at"] or p["fetched_at"],
        })

    print(f"待分析帖子数: {len(analyzed_posts)}")
    opps = deepseek_scorer.score_many(analyzed_posts, sleep_sec=1.0)
    saved = 0
    for opp in opps:
        if opp.get("total_score"):
            db.insert_opportunity(opp, DB_PATH)
            saved += 1

    print(f"\n共保存 {saved} 条机会记录。")
    counts = db.count_opportunities(DB_PATH)
    print(f"机会分布: P0={counts.get('P0',0)}, P1={counts.get('P1',0)}, "
          f"P2={counts.get('P2',0)}, P3={counts.get('P3',0)}")
    return saved


def cmd_list() -> int:
    print("=" * 60)
    print(f"[3/3] 机会清单   DB: {DB_PATH}")
    print("=" * 60)

    opps = db.list_opportunities(min_score=0, limit=200, db_path=DB_PATH)
    if not opps:
        print("暂无机会。先运行: python main.py run")
        return 0

    by_priority: Dict[str, List] = {"P0": [], "P1": [], "P2": [], "P3": []}
    for o in opps:
        pri = o.get("priority") or "P3"
        by_priority.setdefault(pri, []).append(o)

    for pri in ("P0", "P1", "P2", "P3"):
        lst = by_priority.get(pri, [])
        if not lst:
            continue
        print(f"\n--- {pri} ({len(lst)} 条) ---")
        for o in lst[:8]:
            dims = {
                "pain_to_money": o.get("pain_to_money"),
                "traffic": o.get("traffic"),
                "seo": o.get("seo"),
                "usdt": o.get("usdt"),
                "competition": o.get("competition"),
                "build_speed": o.get("build_speed"),
            }
            print(f"  [{o['total_score']:>3} 分] {o['name']}")
            print(f"      痛点: {o.get('pain_point') or ''}")
            print(f"      方案: {o.get('solution') or ''}")
            print(f"      目标: {o.get('target_niche') or ''}")
            print(f"      维度: {dims}")
            print(f"      来源: {o.get('post_url') or '-'}")
    return len(opps)


def cmd_show() -> int:
    posts = db.list_posts(limit=30, db_path=DB_PATH)
    print(f"最新 {len(posts)} 条帖子 (DB: {DB_PATH})")
    by_type: Dict[str, int] = {}
    for p in posts:
        t = p.get("asset_type") or "Other"
        by_type[t] = by_type.get(t, 0) + 1
    print("类型分布:", by_type)
    for p in posts[:10]:
        print(f"  [{p.get('asset_type')}] {p.get('project_name')}: {str(p.get('post_text'))[:80]}")
    return len(posts)


def cmd_run() -> int:
    cmd_crawl()
    cmd_analyze()
    cmd_list()
    return 0


HELP = """
CryptoIntel 命令：
  crawl     抓取 Reddit + RSS，存入 SQLite
  analyze   对数据库里的帖子调用 DeepSeek 评分
  run       crawl + analyze + list 一条龙
  list      打印机会清单
  show      打印最近抓取的帖子
  stats     打印统计

环境变量: ./.env  (DEEPSEEK_API_KEY, DB_PATH, FETCH_LIMIT_PER_SOURCE)
"""


def cmd_stats() -> int:
    print(f"DB: {DB_PATH}")
    print(f"帖子总数: {db.count_posts(DB_PATH)}")
    print(f"机会分布: {db.count_opportunities(DB_PATH)}")
    return 0


def main(argv: List[str]) -> int:
    if len(argv) < 2:
        print(HELP)
        return 1
    cmd = argv[1].lower()
    if cmd == "crawl":
        return cmd_crawl()
    if cmd == "analyze":
        return cmd_analyze()
    if cmd == "run":
        return cmd_run()
    if cmd == "list":
        return cmd_list()
    if cmd == "show":
        return cmd_show()
    if cmd == "stats":
        return cmd_stats()
    print(HELP)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
