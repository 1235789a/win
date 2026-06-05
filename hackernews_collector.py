#!/usr/bin/env python3
"""
Hacker News 数据收集器 - 完全免费，无需 API Key
"""

import requests
import json
import time
from datetime import datetime, timedelta

class HackerNewsCollector:
    """
    Hacker News 数据收集器
    """
    
    def __init__(self):
        self.base_url = "https://hacker-news.firebaseio.com/v0"
    
    def get_top_stories(self, limit=50):
        """
        获取热门故事
        """
        try:
            url = f"{self.base_url}/topstories.json"
            response = requests.get(url, timeout=10)
            story_ids = response.json()
            
            stories = []
            for story_id in story_ids[:limit]:
                story = self.get_story(story_id)
                if story:
                    stories.append(story)
                time.sleep(0.1)
            
            return stories
            
        except Exception as e:
            print(f"Error getting top stories: {e}")
            return []
    
    def get_story(self, story_id):
        """
        获取单个故事详情
        """
        try:
            url = f"{self.base_url}/item/{story_id}.json"
            response = requests.get(url, timeout=10)
            return response.json()
        except Exception as e:
            print(f"Error getting story {story_id}: {e}")
            return None
    
    def get_new_stories(self, limit=50):
        """
        获取最新故事
        """
        try:
            url = f"{self.base_url}/newstories.json"
            response = requests.get(url, timeout=10)
            story_ids = response.json()
            
            stories = []
            for story_id in story_ids[:limit]:
                story = self.get_story(story_id)
                if story:
                    stories.append(story)
                time.sleep(0.1)
            
            return stories
            
        except Exception as e:
            print(f"Error getting new stories: {e}")
            return []
    
    def parse_to_marketing_data(self, stories):
        """
        将 Hacker News 故事转换为营销数据格式
        """
        marketing_data = []
        
        crypto_keywords = [
            'crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'web3',
            'defi', 'token', 'coin', 'exchange', 'wallet', 'airdrop',
            'protocol', 'smart contract', 'layer', 'solana', 'cardano',
            'avalanche', 'polygon', 'cosmos', 'polkadot'
        ]
        
        for story in stories:
            if not story or 'title' not in story:
                continue
            
            title = story.get('title', '')
            text = story.get('text', '')
            content = (title + ' ' + text).lower()
            
            # 检查是否与加密相关
            is_crypto = any(keyword in content for keyword in crypto_keywords)
            
            if is_crypto:
                asset_type = self.classify_asset_type(title, text)
                
                marketing_data.append({
                    'project_name': 'HackerNews',
                    'project_url': 'https://news.ycombinator.com',
                    'post_url': f"https://news.ycombinator.com/item?id={story.get('id', '')}",
                    'image_url': '',
                    'date': datetime.fromtimestamp(story.get('time', 0)).isoformat(),
                    'engagement': {
                        'score': story.get('score', 0),
                        'comments': story.get('descendants', 0)
                    },
                    'asset_type': asset_type,
                    'post_text': f"{title} {text}"
                })
        
        return marketing_data
    
    def classify_asset_type(self, title, text):
        """
        分类资产类型
        """
        content = (title + ' ' + text).lower()
        
        if any(keyword in content for keyword in ['ama', 'ask me anything', 'ask hn']):
            return 'AMA'
        elif any(keyword in content for keyword in ['airdrop', 'giveaway', 'free', 'claim', 'distribution']):
            return 'Airdrop'
        elif any(keyword in content for keyword in ['partnership', 'collaboration', 'partner', 'collab', 'join', 'acquisition']):
            return 'Partnership'
        elif any(keyword in content for keyword in ['listing', 'list', 'exchange', 'launch', 'debut']):
            return 'Listing'
        elif any(keyword in content for keyword in ['meme', 'memes', 'funny']):
            return 'Meme'
        else:
            return 'Other'
    
    def collect(self, limit=100):
        """
        收集数据
        """
        print("\n" + "="*60)
        print("正在收集 Hacker News 数据...")
        print("="*60)
        
        top_stories = self.get_top_stories(limit=50)
        new_stories = self.get_new_stories(limit=50)
        
        all_stories = top_stories + new_stories
        
        marketing_data = self.parse_to_marketing_data(all_stories)
        
        print(f"\n✓ 从 Hacker News 收集了 {len(marketing_data)} 条加密相关数据")
        
        return marketing_data

if __name__ == "__main__":
    collector = HackerNewsCollector()
    data = collector.collect(limit=100)
    
    if data:
        with open('hackernews_crypto_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n✓ 数据已保存到 hackernews_crypto_data.json")