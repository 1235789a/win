"""
DeepSeek 评分器
- 输入: 帖子（post_text, asset_type, project_name, post_url, engagement）
- 输出: 6 维分数 + 机会名称 + 目标领域 + 痛点 + 解决方案 + Blueprint（MVP功能、目标用户、变现方式、技术栈、工期）
"""

import json
import time
import os
import random
from typing import Dict, Any, Optional
import requests


DEFAULT_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEFAULT_MODEL = "deepseek-chat"


def _load_env():
    """简易 .env 解析，不依赖第三方库。"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)


_load_env()


def _safe_int(value, lo: int = 0, hi: int = 100) -> int:
    try:
        n = int(value)
    except Exception:
        return lo
    if n < lo:
        return lo
    if n > hi:
        return hi
    return n


SYSTEM_PROMPT = """你是一名海外 AI 工具套利机会分析师，任务是从加密社区的帖子里发掘是否存在值得做的小工具机会。

请只输出一个严格合法的 JSON 对象，字段如下：
- pain_to_money: number (0-25) 用户是否愿意付钱解决这个问题
- traffic: number (0-20) 获取目标用户的难易程度（分数越高越容易）
- seo: number (0-20) 搜索引擎/地理优化潜力
- usdt: number (0-10) USDT 收款模式的适配度
- competition: number (0-15) 市场竞争缺口（越大越缺工具）
- build_speed: number (0-10) 2-4 周内是否能完成 MVP
- opportunity_name: string，20 字以内的机会名称
- target_niche: string，目标领域/人群，20 字以内
- pain_point: string，用户痛点描述，40 字以内
- solution: string，产品一句话描述，40 字以内
- mvp_features: array[string]，3-5 个 MVP 功能
- target_users: string，目标用户描述
- monetization: string，USDT/美元变现方式
- tech_stack: array[string]，3-4 个关键技术栈
- estimated_build_time: string，"1周" / "2周" / "3周" / "4周"

只输出 JSON，不要任何前后文字说明。"""


def _build_user_prompt(post: Dict[str, Any]) -> str:
    lines = [
        "请分析以下加密社区帖子，判断是否存在值得做的 AI/工具 机会：",
        "",
        f"来源平台: {post.get('platform', 'unknown')}",
        f"项目/版块: {post.get('project_name', '')}",
        f"资产类型: {post.get('asset_type', 'Other')}",
        f"发布时间: {post.get('date', '')}",
        f"原文链接: {post.get('post_url', '')}",
        f"互动数据(点赞/评论/浏览): {post.get('engagement', {})}",
        "",
        "--- 帖子正文 ---",
        post.get("post_text", "")[:1500],
    ]
    return "\n".join(lines)


def _parse_llm_json(text: str) -> Dict[str, Any]:
    """尝试从 LLM 文本里提取 JSON。"""
    if not text:
        return {}
    text = text.strip()
    # 去掉 ```json ... ``` 包裹
    if text.startswith("```"):
        text = text.lstrip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip().rstrip("`")
    # 找到第一对大括号
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return {}
    snippet = text[start:end + 1]
    try:
        return json.loads(snippet)
    except Exception:
        return {}


def call_deepseek(post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """调用 DeepSeek 得到评分 JSON。失败返回 None。"""
    api_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    api_url = os.environ.get("DEEPSEEK_API_URL", DEFAULT_API_URL)
    model = os.environ.get("DEEPSEEK_MODEL", DEFAULT_MODEL)

    if not api_key or api_key == "你的deepseek_apikey":
        return None

    payload = {
        "model": model,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(post)},
        ],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        r = requests.post(api_url, headers=headers, json=payload, timeout=60)
        if r.status_code != 200:
            print(f"  [DeepSeek] HTTP {r.status_code}: {r.text[:200]}")
            return None
        body = r.json()
        content = body["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  [DeepSeek] 调用异常: {e}")
        return None

    parsed = _parse_llm_json(content)
    if not parsed:
        print(f"  [DeepSeek] 返回内容不是合法 JSON: {content[:300]}")
        return None
    return parsed


def score_post(post: Dict[str, Any]) -> Dict[str, Any]:
    """对单条帖子评分，失败则返回空字典。"""
    parsed = call_deepseek(post)
    if not parsed:
        return {}

    scores = {
        "pain_to_money": _safe_int(parsed.get("pain_to_money"), 0, 25),
        "traffic": _safe_int(parsed.get("traffic"), 0, 20),
        "seo": _safe_int(parsed.get("seo"), 0, 20),
        "usdt": _safe_int(parsed.get("usdt"), 0, 10),
        "competition": _safe_int(parsed.get("competition"), 0, 15),
        "build_speed": _safe_int(parsed.get("build_speed"), 0, 10),
    }
    total = sum(scores.values())

    if total >= 75:
        priority = "P0"
    elif total >= 60:
        priority = "P1"
    elif total >= 45:
        priority = "P2"
    else:
        priority = "P3"

    bp_raw = parsed or {}
    return {
        "post_id": post.get("_post_id"),
        "name": str(bp_raw.get("opportunity_name") or post.get("asset_type", "Opportunity"))[:80],
        "target_niche": str(bp_raw.get("target_niche") or "")[:80],
        "pain_point": str(bp_raw.get("pain_point") or "")[:200],
        "solution": str(bp_raw.get("solution") or "")[:200],
        "total_score": total,
        "dimensions": scores,
        "priority": priority,
        "blueprint": {
            "mvp_features": bp_raw.get("mvp_features") or [],
            "target_users": bp_raw.get("target_users") or "",
            "monetization": bp_raw.get("monetization") or "",
            "tech_stack": bp_raw.get("tech_stack") or [],
            "estimated_build_time": bp_raw.get("estimated_build_time") or "",
        },
    }


def score_many(posts: List[Dict[str, Any]], sleep_sec: float = 1.2) -> List[Dict[str, Any]]:
    """批量评分。posts 里可以自带 _post_id 以关联数据库记录。"""
    from typing import List  # 避免在顶部导入

    results = []
    for idx, p in enumerate(posts, 1):
        print(f"  [{idx}/{len(posts)}] 评分中 - {p.get('asset_type')}: {p.get('post_text')[:60]}")
        opp = score_post(p)
        if opp:
            results.append(opp)
            print(f"    -> {opp['priority']} {opp['total_score']} 分 | {opp['name']}")
        else:
            print(f"    -> 跳过（API 不可用或失败）")
        if sleep_sec > 0 and idx < len(posts):
            time.sleep(sleep_sec)
    return results


if __name__ == "__main__":
    sample = {
        "platform": "reddit",
        "project_name": "r/CryptoCurrency",
        "post_url": "https://reddit.com/example",
        "post_text": "大家都在抱怨空投太多，找不到新机会。有没有人愿意做一个聚合工具？",
        "asset_type": "Airdrop",
        "engagement": {"likes": 120, "comments": 40},
        "date": "2026-06-13T10:00:00",
    }
    result = score_post(sample)
    print(json.dumps(result, ensure_ascii=False, indent=2))
