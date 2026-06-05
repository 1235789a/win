#!/usr/bin/env python3
"""
简单测试脚本 - 测试 Reddit JSON 接口
"""

import requests
import json
from datetime import datetime

def test_reddit():
    print("="*60)
    print("测试 Reddit JSON 接口")
    print("="*60)
    
    url = "https://www.reddit.com/r/cryptocurrency/.json"
    
    headers = {
        'User-Agent': 'TestBot/1.0'
    }
    
    try:
        print(f"\n正在访问: {url}")
        response = requests.get(url, headers=headers, timeout=10)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 成功获取数据！")
            
            posts = data['data']['children']
            print(f"\n获取了 {len(posts)} 个帖子")
            
            print("\n前3个帖子:")
            for i, post in enumerate(posts[:3]):
                print(f"  {i+1}. {post['data']['title'][:80]}")
            
            # 保存测试数据
            with open('reddit_test.json', 'w', encoding='utf-8') as f:
                json.dump([{
                    'title': p['data']['title'],
                    'url': f"https://reddit.com" + p['data']['permalink'],
                    'score': p['data']['score'],
                    'comments': p['data']['num_comments'],
                    'created': datetime.fromtimestamp(p['data']['created_utc']).isoformat()
                } for p in posts], f, ensure_ascii=False, indent=2)
            
            print(f"\n✓ 测试数据已保存到 reddit_test.json")
            return True
            
    except Exception as e:
        print(f"✗ 错误: {e}")
        return False

if __name__ == "__main__":
    test_reddit()