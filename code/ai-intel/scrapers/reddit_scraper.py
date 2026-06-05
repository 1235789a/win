"""
Reddit Scrapling 爬虫
增强版，支持动态页面渲染
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime


class RedditScraper:
    """
    Reddit 爬虫
    使用 Scrapling 抓取动态渲染页面
    """
    
    def __init__(self):
        self.base_url = "https://www.reddit.com"
        
    async def get_subreddit_posts(self, subreddit: str, sort='hot', limit=25) -> List[Dict]:
        """
        获取 subreddit 帖子
        
        Args:
            subreddit: 子版块名称（不含 r/）
            sort: 排序方式 (hot, new, top, rising)
            limit: 获取数量
            
        Returns:
            帖子列表
        """
        from scrapling import DynamicFetcher
        
        url = f"{self.base_url}/r/{subreddit}/{sort}/"
        
        try:
            with DynamicFetcher() as fetcher:
                page = fetcher.fetch(url)
                
                # 等待帖子加载
                try:
                    page.wait_for_selector('[data-testid="post-container"]', timeout=10000)
                except:
                    # 尝试备选选择器
                    try:
                        page.wait_for_selector('.Post', timeout=5000)
                    except:
                        print(f"⚠️ 无法找到帖子元素")
                        return []
                
                posts = []
                
                # 尝试多个选择器
                post_elements = (
                    page.css('[data-testid="post-container"]') or
                    page.css('.Post') or
                    page.css('[data-click-id="body"]')
                )
                
                for post in post_elements[:limit]:
                    try:
                        post_data = {
                            'platform': 'reddit',
                            'project_name': f'r/{subreddit}',
                            'project_url': f'{self.base_url}/r/{subreddit}',
                            'post_url': '',
                            'image_url': '',
                            'date': '',
                            'engagement': {
                                'score': 0,
                                'comments': 0,
                                'upvotes': 0
                            },
                            'asset_type': 'Other',
                            'post_text': '',
                            'collected_at': datetime.now().isoformat(),
                            'source': 'scrapling',
                            'meta': {'subreddit': subreddit, 'sort': sort}
                        }
                        
                        # 提取标题
                        title_elem = (
                            post.css('h3') or
                            post.css('[data-testid="post-title"]') or
                            post.css('a[data-click-id="body"]')
                        )
                        if title_elem:
                            post_data['post_text'] = title_elem.text().strip()
                        
                        # 提取链接
                        link_elem = post.css('a[data-click-id="body"]')
                        if link_elem:
                            href = link_elem.att('href')
                            if href:
                                if href.startswith('/'):
                                    post_data['post_url'] = f'{self.base_url}{href}'
                                else:
                                    post_data['post_url'] = href
                        
                        # 提取分数
                        score_elem = (
                            post.css('[data-testid="vote-arrows"]') or
                            post.css('.score')
                        )
                        if score_elem:
                            score_text = score_elem.text().strip()
                            post_data['engagement']['score'] = self._parse_score(score_text)
                        
                        # 提取评论数
                        comments_elem = post.css('a[data-click-id="comments"]')
                        if comments_elem:
                            comments_text = comments_elem.text().strip()
                            post_data['engagement']['comments'] = self._parse_comments(comments_text)
                        
                        # 提取图片
                        img_elem = post.css('img')
                        if img_elem:
                            src = img_elem.att('src')
                            if src and not src.startswith('data:'):
                                post_data['image_url'] = src
                        
                        # 分类
                        post_data['asset_type'] = self._classify_asset_type(post_data['post_text'])
                        
                        if post_data['post_text']:
                            posts.append(post_data)
                    
                    except Exception as e:
                        continue
                
                return posts
                
        except Exception as e:
            print(f"❌ 获取 Reddit 帖子失败: {e}")
            return []
    
    def _parse_score(self, text: str) -> int:
        """解析分数"""
        if not text:
            return 0
        
        text = text.strip().replace(',', '')
        
        # 处理 K, M 后缀
        if 'K' in text:
            try:
                return int(float(text.replace('K', '')) * 1000)
            except:
                return 0
        elif 'M' in text:
            try:
                return int(float(text.replace('M', '')) * 1000000)
            except:
                return 0
        
        try:
            return int(text)
        except:
            return 0
    
    def _parse_comments(self, text: str) -> int:
        """解析评论数"""
        if not text:
            return 0
        
        # 提取数字
        import re
        numbers = re.findall(r'\d+', text)
        if numbers:
            try:
                return int(numbers[0])
            except:
                return 0
        
        return 0
    
    def _classify_asset_type(self, text: str) -> str:
        """分类资产类型"""
        if not text:
            return 'Other'
        
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ['ama', 'ask me anything', 'ask hn']):
            return 'AMA'
        elif any(keyword in text_lower for keyword in ['airdrop', 'giveaway', 'free token', 'claim']):
            return 'Airdrop'
        elif any(keyword in text_lower for keyword in ['partnership', 'collaboration', 'announcement']):
            return 'Partnership'
        elif any(keyword in text_lower for keyword in ['listing', 'exchange', 'trading', 'launch']):
            return 'Listing'
        elif any(keyword in text_lower for keyword in ['meme', 'funny', 'joke']):
            return 'Meme'
        else:
            return 'Other'


async def test_reddit_scraper():
    """测试 Reddit 爬虫"""
    print("=" * 60)
    print("测试 Reddit Scrapling 爬虫")
    print("=" * 60)
    
    scraper = RedditScraper()
    
    # 测试获取 cryptocurrency 版块
    print("\n📱 测试获取 r/cryptocurrency 帖子...")
    
    try:
        posts = await scraper.get_subreddit_posts('cryptocurrency', sort='hot', limit=10)
        
        print(f"\n✅ 成功获取 {len(posts)} 条帖子")
        
        for i, post in enumerate(posts[:5], 1):
            print(f"\n--- 帖子 {i} ---")
            print(f"标题: {post['post_text'][:100]}...")
            print(f"分数: {post['engagement']['score']}")
            print(f"评论: {post['engagement']['comments']}")
            print(f"类型: {post['asset_type']}")
            print(f"链接: {post['post_url']}")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")


if __name__ == "__main__":
    asyncio.run(test_reddit_scraper())