#!/usr/bin/env python3
"""
Reddit 数据收集脚本 - 无需 API Key
直接访问公开 JSON 接口
"""

import requests
import json
import time
from datetime import datetime

def get_reddit_posts(subreddit, limit=25):
    """
    从 Reddit 获取帖子（无需 API Key）
    """
    url = f"https://www.reddit.com/r/{subreddit}.json"
    
    headers = {
        'User-Agent': 'CryptoDataCollector/1.0 (by u/YourUsername)'
    }
    
    try:
        response = requests.get(url, headers=headers, params={'limit': limit})
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def parse_posts(data):
    """
    解析 Reddit 帖子数据
    """
    posts = []
    
    if not data or 'data' not in data:
        return posts
    
    for item in data['data']['children']:
        post = item['data']
        
        posts.append({
            'project_name': f"r/{item['data']['subreddit']}",
            'project_url': f"https://reddit.com/r/{item['data']['subreddit']}",
            'post_url': f"https://reddit.com{item['data']['permalink']}",
            'image_url': post.get('thumbnail', '') if post.get('thumbnail') and post['thumbnail'].startswith('http') else '',
            'date': datetime.fromtimestamp(post['created_utc']).isoformat(),
            'engagement': {
                'likes': post.get('score', 0),
                'comments': post.get('num_comments', 0),
                'ups': post.get('ups', 0),
                'downs': post.get('downs', 0)
            },
            'asset_type': classify_asset_type(post['title'], post.get('selftext', '')),
            'post_text': f"{post['title']} {post.get('selftext', '')}"
        })
    
    return posts

def classify_asset_type(title, text):
    """
    简单分类资产类型
    """
    content = (title + ' ' + text).lower()
    
    if any(keyword in content for keyword in ['ama', 'ask me anything']):
        return 'AMA'
    elif any(keyword in content for keyword in ['airdrop', 'giveaway', 'free', 'claim']):
        return 'Airdrop'
    elif any(keyword in content for keyword in ['partnership', 'collaboration', 'partner', 'collab']):
        return 'Partnership'
    elif any(keyword in content for keyword in ['listing', 'list', 'exchange']):
        return 'Listing'
    elif any(keyword in content for keyword in ['meme', 'memes']):
        return 'Meme'
    else:
        return 'Other'

def save_to_json(posts, filename='reddit_data.json'):
    """
    保存数据到 JSON 文件
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    print(f"Data saved to {filename}")

def main():
    """
    主函数 - 收集 Reddit 加密项目数据
    """
    print("="*60)
    print("Reddit 加密项目营销数据收集器")
    print("无需 API Key，立即可用！")
    print("="*60)
    
    subreddits = [
        'cryptocurrency',
        'CryptoCurrency',
        'CryptoMarkets',
        'altcoin',
        'Bitcoin',
        'Ethereum',
        'Cardano',
        'Solana',
        'Avalanche',
        'Defi',
        'NFT',
        'web3'
    ]
    
    all_posts = []
    
    for subreddit in subreddits:
        print(f"\n正在获取 r/{subreddit} ...")
        
        data = get_reddit_posts(subreddit, limit=25)
        
        if data:
            posts = parse_posts(data)
            all_posts.extend(posts)
            print(f"  ✓ 获取了 {len(posts)} 个帖子")
        else:
            print(f"  ✗ 获取失败")
        
        # 避免速率限制，暂停一下
        time.sleep(2)
    
    print(f"\n" + "="*60)
    print(f"总计收集了 {len(all_posts)} 个帖子")
    print("="*60)
    
    # 按类型统计
    type_count = {}
    for post in all_posts:
        asset_type = post['asset_type']
        type_count[asset_type] = type_count.get(asset_type, 0) + 1
    
    print("\n类型统计：")
    for asset_type, count in sorted(type_count.items()):
        print(f"  {asset_type}: {count}")
    
    # 保存数据
    if all_posts:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_to_json(all_posts, f"reddit_crypto_data_{timestamp}.json")
        save_to_json(all_posts[:100], f"reddit_sample_100.json")
        
        print(f"\n✅ 数据已保存！")
        print(f"   - 完整数据: reddit_crypto_data_{timestamp}.json")
        print(f"   - 100条样本: reddit_sample_100.json")

if __name__ == "__main__":
    main()