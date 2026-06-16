"""
SQLite 存储层
- 存抓取到的帖子（posts）
- 存分析后的机会（opportunities）
- 简单去重：以 post_url 作为唯一键
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Any


def get_conn(db_path: str = "./data/cryptointel.db") -> sqlite3.Connection:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = "./data/cryptointel.db") -> None:
    conn = get_conn(db_path)
    c = conn.cursor()
    c.executescript(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            project_name TEXT,
            project_url TEXT,
            post_url TEXT UNIQUE,
            image_url TEXT,
            post_text TEXT,
            asset_type TEXT,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            published_at TEXT,
            fetched_at TEXT,
            raw_json TEXT
        );

        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            name TEXT,
            target_niche TEXT,
            pain_point TEXT,
            solution TEXT,
            total_score INTEGER,
            pain_to_money INTEGER,
            traffic INTEGER,
            seo INTEGER,
            usdt INTEGER,
            competition INTEGER,
            build_speed INTEGER,
            priority TEXT,
            blueprint_json TEXT,
            analyzed_at TEXT,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_posts_fetched_at ON posts(fetched_at);
        CREATE INDEX IF NOT EXISTS idx_posts_asset_type ON posts(asset_type);
        CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(total_score DESC);
        CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(priority);
        """
    )
    conn.commit()
    conn.close()


def upsert_post(post: Dict[str, Any], db_path: str = "./data/cryptointel.db") -> int:
    """插入或更新帖子。返回 post.id；若 post_url 已存在则仅更新并返回已存在的 id。"""
    conn = get_conn(db_path)
    c = conn.cursor()
    url = post.get("post_url")
    if not url:
        conn.close()
        return 0

    c.execute("SELECT id FROM posts WHERE post_url = ?", (url,))
    row = c.fetchone()

    now = datetime.utcnow().isoformat()
    eng = post.get("engagement", {}) or {}
    data = (
        post.get("platform", "unknown"),
        post.get("project_name"),
        post.get("project_url"),
        post.get("image_url"),
        post.get("post_text"),
        post.get("asset_type"),
        eng.get("likes") or eng.get("score") or 0,
        eng.get("comments") or 0,
        eng.get("views") or 0,
        post.get("date") or post.get("published_at"),
        now,
        json.dumps(post, ensure_ascii=False),
    )

    if row:
        c.execute(
            """UPDATE posts SET
                platform=?, project_name=?, project_url=?, image_url=?,
                post_text=?, asset_type=?, likes=?, comments=?, views=?,
                published_at=?, fetched_at=?, raw_json=?
               WHERE post_url=?""",
            data + (url,),
        )
        conn.commit()
        conn.close()
        return row["id"]
    else:
        c.execute(
            """INSERT INTO posts
                (platform, project_name, project_url, image_url, post_text,
                 asset_type, likes, comments, views, published_at, fetched_at, raw_json, post_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            data + (url,),
        )
        conn.commit()
        new_id = c.lastrowid
        conn.close()
        return new_id


def insert_opportunity(opp: Dict[str, Any], db_path: str = "./data/cryptointel.db") -> int:
    conn = get_conn(db_path)
    c = conn.cursor()
    dims = opp.get("dimensions", {}) or {}
    bp = opp.get("blueprint") or {}
    c.execute(
        """INSERT INTO opportunities
            (post_id, name, target_niche, pain_point, solution, total_score,
             pain_to_money, traffic, seo, usdt, competition, build_speed,
             priority, blueprint_json, analyzed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            opp.get("post_id"),
            opp.get("name"),
            opp.get("target_niche"),
            opp.get("pain_point"),
            opp.get("solution"),
            opp.get("total_score"),
            dims.get("pain_to_money"),
            dims.get("traffic"),
            dims.get("seo"),
            dims.get("usdt"),
            dims.get("competition"),
            dims.get("build_speed"),
            opp.get("priority"),
            json.dumps(bp, ensure_ascii=False),
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return new_id


def list_posts(limit: int = 50, asset_type: Optional[str] = None, db_path: str = "./data/cryptointel.db") -> List[Dict[str, Any]]:
    conn = get_conn(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    if asset_type:
        c.execute(
            "SELECT * FROM posts WHERE asset_type = ? ORDER BY id DESC LIMIT ?",
            (asset_type, limit),
        )
    else:
        c.execute("SELECT * FROM posts ORDER BY id DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_opportunities(min_score: int = 0, limit: int = 50,
                       db_path: str = "./data/cryptointel.db") -> List[Dict[str, Any]]:
    conn = get_conn(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute(
        """SELECT o.*, p.post_url, p.post_text, p.asset_type as post_asset_type,
                  p.platform as post_platform, p.project_name as post_project_name
           FROM opportunities o LEFT JOIN posts p ON p.id = o.post_id
           WHERE o.total_score >= ? ORDER BY o.total_score DESC LIMIT ?""",
        (min_score, limit),
    )
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def count_posts(db_path: str = "./data/cryptointel.db") -> int:
    conn = get_conn(db_path)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM posts")
    n = c.fetchone()[0]
    conn.close()
    return n


def count_opportunities(db_path: str = "./data/cryptointel.db") -> Dict[str, int]:
    conn = get_conn(db_path)
    c = conn.cursor()
    c.execute(
        "SELECT priority, COUNT(*) FROM opportunities GROUP BY priority"
    )
    rows = c.fetchall()
    result = {r[0]: r[1] for r in rows}
    conn.close()
    return result
