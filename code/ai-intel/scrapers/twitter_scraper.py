"""
Scrapling Twitter 爬虫
基于 Scrapling 框架，无需 API Key
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime

# Scrapling 导入
try:
    from scrapling import StealthFetcher, DynamicFetcher, Fetcher
    from scrapling.adaptive import AdaptiveParser
    SCRAPLING_AVAILABLE = True
except ImportError:
    SCRAPLING_AVAILABLE = False
    print("⚠️ Scrapling 未安装，运行: pip install scrapling")


class TwitterScraper:
    """
    Twitter/X 爬虫
    使用 Scrapling 绕过反爬机制
    """
    
    def __init__(self, use_stealth=True):
        self.use_stealth = use_stealth
        self.fetcher = None
        
    def __enter__(self):
        if SCRAPLING_AVAILABLE:
            if self.use_stealth:
                # 使用 StealthFetcher 绕过 Cloudflare 等反爬
                self.fetcher = StealthFetcher(solve_cloudflare=True, stealth=True)
            else:
                self.fetcher = DynamicFetcher()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.fetcher:
            self.fetcher.__exit__(exc_type, exc_val, exc_tb)
    
    async def fetch_page(self, url: str) -> Optional[any]:
        """获取页面"""
        if not self.fetcher:
            return None
        
        try:
            page = await self.fetcher.fetch(url)
            return page
        except Exception as e:
            print(f"❌ 获取页面失败: {e}")
            return None
    
    async def get_user_tweets(self, username: str, limit: int = 20) -> List[Dict]:
        """
        获取用户推文
        
        Args:
            username: Twitter 用户名（不含 @）
            limit: 获取数量
            
        Returns:
            推文列表
        """
        url = f"https://x.com/{username}"
        page = await self.fetch_page(url)
        
        if not page:
            return []
        
        tweets = []
        
        try:
            # 等待推文加载
            await page.wait_for_selector('[data-testid="tweet"]', timeout=10000)
            
            # 提取推文
            tweet_elements = page.css('[data-testid="tweet"]')
            
            for tweet in tweet_elements[:limit]:
                try:
                    tweet_data = {
                        'platform': 'twitter',
                        'project_name': username,
                        'project_url': url,
                        'post_url': '',
                        'image_url': '',
                        'date': '',
                        'engagement': {
                            'likes': 0,
                            'retweets': 0,
                            'replies': 0,
                            'views': 0
                        },
                        'asset_type': 'Other',
                        'post_text': '',
                        'collected_at': datetime.now().isoformat(),
                        'source': 'scrapling'
                    }
                    
                    # 提取文本
                    text_elem = tweet.css('[data-testid="tweetText"]')
                    if text_elem:
                        tweet_data['post_text'] = text_elem.text().strip()
                    
                    # 提取时间
                    time_elem = tweet.css('time')
                    if time_elem:
                        tweet_data['date'] = time_elem.att('datetime') or ''
                    
                    # 提取链接
                    link_elem = tweet.css('a[href*="/status/"]')
                    if link_elem:
                        href = link_elem.att('href')
                        if href:
                            tweet_data['post_url'] = f"https://x.com{href}"
                    
                    # 提取互动数据
                    like_elem = tweet.css('[data-testid="like"]')
                    if like_elem:
                        text = like_elem.text().strip()
                        tweet_data['engagement']['likes'] = self._parse_number(text)
                    
                    retweet_elem = tweet.css('[data-testid="retweet"]')
                    if retweet_elem:
                        text = retweet_elem.text().strip()
                        tweet_data['engagement']['retweets'] = self._parse_number(text)
                    
                    reply_elem = tweet.css('[data-testid="reply"]')
                    if reply_elem:
                        text = reply_elem.text().strip()
                        tweet_data['engagement']['replies'] = self._parse_number(text)
                    
                    # 提取图片
                    img_elem = tweet.css('img[src*="media"]')
                    if img_elem:
                        tweet_data['image_url'] = img_elem.att('src') or ''
                    
                    # 分类
                    tweet_data['asset_type'] = self._classify_asset_type(tweet_data['post_text'])
                    
                    tweets.append(tweet_data)
                    
                except Exception as e:
                    print(f"⚠️ 解析推文失败: {e}")
                    continue
                    
        except Exception as e:
            print(f"⚠️ 等待推文加载失败: {e}")
        
        return tweets
    
    async def search_tweets(self, query: str, limit: int = 20) -> List[Dict]:
        """
        搜索推文
        
        Args:
            query: 搜索关键词
            limit: 获取数量
            
        Returns:
            推文列表
        """
        url = f"https://x.com/search?q={query}&f=live"
        page = await self.fetch_page(url)
        
        if not page:
            return []
        
        tweets = []
        
        try:
            await page.wait_for_selector('[data-testid="tweet"]', timeout=10000)
            tweet_elements = page.css('[data-testid="tweet"]')
            
            for tweet in tweet_elements[:limit]:
                try:
                    tweet_data = {
                        'platform': 'twitter',
                        'project_name': 'Search',
                        'project_url': url,
                        'post_url': '',
                        'image_url': '',
                        'date': '',
                        'engagement': {
                            'likes': 0,
                            'retweets': 0,
                            'replies': 0,
                            'views': 0
                        },
                        'asset_type': 'Other',
                        'post_text': '',
                        'collected_at': datetime.now().isoformat(),
                        'source': 'scrapling',
                        'meta': {'query': query}
                    }
                    
                    text_elem = tweet.css('[data-testid="tweetText"]')
                    if text_elem:
                        tweet_data['post_text'] = text_elem.text().strip()
                    
                    time_elem = tweet.css('time')
                    if time_elem:
                        tweet_data['date'] = time_elem.att('datetime') or ''
                    
                    link_elem = tweet.css('a[href*="/status/"]')
                    if link_elem:
                        href = link_elem.att('href')
                        if href:
                            tweet_data['post_url'] = f"https://x.com{href}"
                    
                    # 提取作者信息
                    author_elem = tweet.css('[data-testid="User-Name"] a[href*="/"]')
                    if author_elem:
                        href = author_elem.att('href')
                        if href:
                            tweet_data['project_name'] = href.strip('/')
                            tweet_data['project_url'] = f"https://x.com{href}"
                    
                    tweet_data['asset_type'] = self._classify_asset_type(tweet_data['post_text'])
                    tweets.append(tweet_data)
                    
                except Exception as e:
                    continue
        
        except Exception as e:
            print(f"⚠️ 搜索失败: {e}")
        
        return tweets
    
    def _parse_number(self, text: str) -> int:
        """解析数字"""
        if not text:
            return 0
        
        text = text.strip()
        if not text:
            return 0
        
        # 处理 K, M 后缀
        if text.endswith('K'):
            try:
                return int(float(text[:-1]) * 1000)
            except:
                return 0
        elif text.endswith('M'):
            try:
                return int(float(text[:-1]) * 1000000)
            except:
                return 0
        
        # 尝试直接解析
        try:
            return int(text.replace(',', ''))
        except:
            return 0
    
    def _classify_asset_type(self, text: str) -> str:
        """分类资产类型"""
        if not text:
            return 'Other'
        
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ['ama', 'ask me anything']):
            return 'AMA'
        elif any(keyword in text_lower for keyword in ['airdrop', 'giveaway', 'free', 'claim']):
            return 'Airdrop'
        elif any(keyword in text_lower for keyword in ['partnership', 'collaboration', 'partner']):
            return 'Partnership'
        elif any(keyword in text_lower for keyword in ['listing', 'exchange', 'trading']):
            return 'Listing'
        elif any(keyword in text_lower for keyword in ['meme', 'funny']):
            return 'Meme'
        else:
            return 'Other'


async def test_twitter_scraper():
    """测试 Twitter 爬虫"""
    print("=" * 60)
    print("测试 Twitter Scrapling 爬虫")
    print("=" * 60)
    
    if not SCRAPLING_AVAILABLE:
        print("\n❌ 请先安装 Scrapling:")
        print("   pip install scrapling")
        print("   scrapling install")
        return
    
    # 测试获取用户推文
    print("\n📱 测试获取用户推文...")
    
    try:
        with TwitterScraper(use_stealth=True) as scraper:
            tweets = await scraper.get_user_tweets('elonmusk', limit=5)
            
            print(f"\n✅ 成功获取 {len(tweets)} 条推文")
            
            for i, tweet in enumerate(tweets[:3], 1):
                print(f"\n--- 推文 {i} ---")
                print(f"文本: {tweet['post_text'][:100]}...")
                print(f"时间: {tweet['date']}")
                print(f"点赞: {tweet['engagement']['likes']}")
                print(f"链接: {tweet['post_url']}")
                print(f"类型: {tweet['asset_type']}")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        print("\n可能原因:")
        print("1. 网络连接问题")
        print("2. X.com 反爬机制增强")
        print("3. 需要配置代理")


if __name__ == "__main__":
    asyncio.run(test_twitter_scraper())