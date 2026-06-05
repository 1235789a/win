"""
加密项目营销数据收集器
基于 Scrapling 的统一爬虫系统
"""

import asyncio
import json
from typing import List, Dict, Optional
from datetime import datetime
from twitter_scraper import TwitterScraper
from reddit_scraper import RedditScraper


class CryptoMarketingCollector:
    """
    加密项目营销数据统一收集器
    
    支持平台:
    - Twitter/X
    - Reddit
    - Telegram (待实现)
    - Medium (待实现)
    - Discord (待实现)
    """
    
    def __init__(self):
        self.twitter = TwitterScraper(use_stealth=True)
        self.reddit = RedditScraper()
        
        # 加密项目 Twitter 账号列表
        self.crypto_twitter_accounts = [
            'Bitcoin', 'ethereum', 'VitalikButerin', 'saylor',
            'Coinbase', 'binance', 'CryptoCom', 'OKX',
            'Solana', 'SolanaFM', 'Solana生态',
            'Cardano', 'InputOutputHK',
            'Polkadot', 'Web3Foundation',
            'Avax tomorrow', 'avalancheavax',
            'polygonoperations', '0xPolygon',
            'chainlink', 'ChainlinkNews',
            'uniswap', 'Uniswap',
            'aaveaave', 'AaveAave',
            'MakerDAO', 'makerdao',
            'arbitrum', 'ArbitrumDAO',
            'optimismFND', 'Optimism',
            'zksync', 'ZkSync',
            'StarkWareLtd', 'StarkNet',
            'base', 'Base',
            'dogecoin', 'Dogecoin',
            'Shibtoken', 'Shibtoken',
            'PepeCoinETH', 'PepeCoin',
            'BonkToken', 'Bonk',
            'floki', 'Floki',
            'AxieInfinity', 'AxieInfinity',
            ' decentraland', 'Decentraland',
            'TheSandboxGame', 'SandboxGame',
            'Filecoin', 'Filecoin',
            'StellarOrg', 'Stellar',
            'XRP', 'Ripple',
            'litecoin', 'Litecoin',
            'Monero', 'Monero',
        ]
        
        # Reddit 加密版块列表
        self.crypto_subreddits = [
            'cryptocurrency',
            'CryptoCurrency',
            'CryptoMarkets',
            'altcoin',
            'Bitcoin',
            'ethereum',
            'Solana', 'cardano', 'Polkadot',
            'Defi', ' decentraland',
        ]
    
    async def collect_all(self, limit_per_source=20) -> List[Dict]:
        """
        收集所有平台数据
        
        Args:
            limit_per_source: 每个来源的收集数量
            
        Returns:
            所有收集的数据
        """
        all_data = []
        
        print("\n" + "=" * 60)
        print("开始收集加密项目营销数据")
        print("=" * 60)
        
        # 1. 收集 Twitter 数据
        print("\n🐦 收集 Twitter 数据...")
        twitter_data = await self._collect_twitter(limit_per_source)
        all_data.extend(twitter_data)
        print(f"   ✅ 获取 {len(twitter_data)} 条 Twitter 数据")
        
        # 2. 收集 Reddit 数据
        print("\n📦 收集 Reddit 数据...")
        reddit_data = await self._collect_reddit(limit_per_source)
        all_data.extend(reddit_data)
        print(f"   ✅ 获取 {len(reddit_data)} 条 Reddit 数据")
        
        print("\n" + "=" * 60)
        print(f"总计收集 {len(all_data)} 条数据")
        print("=" * 60)
        
        return all_data
    
    async def _collect_twitter(self, limit: int) -> List[Dict]:
        """收集 Twitter 数据"""
        all_tweets = []
        
        # 随机选择部分账号进行收集
        import random
        selected_accounts = random.sample(
            self.crypto_twitter_accounts,
            min(10, len(self.crypto_twitter_accounts))
        )
        
        for account in selected_accounts:
            try:
                with TwitterScraper(use_stealth=True) as scraper:
                    tweets = await scraper.get_user_tweets(account, limit=5)
                    all_tweets.extend(tweets)
                    
                # 避免请求过快
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"   ⚠️ 获取 {account} 失败: {e}")
                continue
        
        # 按日期排序，取最新的
        all_tweets.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return all_tweets[:limit]
    
    async def _collect_reddit(self, limit: int) -> List[Dict]:
        """收集 Reddit 数据"""
        all_posts = []
        
        for subreddit in self.crypto_subreddits[:5]:
            try:
                posts = await self.reddit.get_subreddit_posts(subreddit, sort='hot', limit=10)
                all_posts.extend(posts)
                
                # 避免请求过快
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"   ⚠️ 获取 r/{subreddit} 失败: {e}")
                continue
        
        # 按分数排序
        all_posts.sort(key=lambda x: x.get('engagement', {}).get('score', 0), reverse=True)
        
        return all_posts[:limit]
    
    def save_to_json(self, data: List[Dict], filename: str):
        """保存数据到 JSON 文件"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 数据已保存到 {filename}")
    
    def print_statistics(self, data: List[Dict]):
        """打印统计信息"""
        print("\n" + "=" * 60)
        print("类型统计 (Type Count)")
        print("=" * 60)
        
        type_count = {}
        platform_count = {}
        
        for item in data:
            # 统计类型
            asset_type = item.get('asset_type', 'Other')
            type_count[asset_type] = type_count.get(asset_type, 0) + 1
            
            # 统计平台
            platform = item.get('platform', 'unknown')
            platform_count[platform] = platform_count.get(platform, 0) + 1
        
        print("\n📊 按类型:")
        for asset_type in ['AMA', 'Airdrop', 'Partnership', 'Listing', 'Giveaway', 'Meme', 'Other']:
            count = type_count.get(asset_type, 0)
            print(f"   {asset_type}: {count}")
        
        print("\n📊 按平台:")
        for platform, count in sorted(platform_count.items()):
            print(f"   {platform}: {count}")
        
        print("=" * 60)


async def main():
    """主函数"""
    print("=" * 60)
    print("加密项目营销数据收集器")
    print("基于 Scrapling 框架")
    print("=" * 60)
    
    collector = CryptoMarketingCollector()
    
    # 收集数据
    data = await collector.collect_all(limit_per_source=30)
    
    if data:
        # 打印统计
        collector.print_statistics(data)
        
        # 保存数据
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        collector.save_to_json(data, f"crypto_marketing_data_{timestamp}.json")
        collector.save_to_json(data, "crypto_marketing_data_latest.json")
        
        # 按类型分别保存
        for asset_type in ['AMA', 'Airdrop', 'Partnership', 'Listing', 'Giveaway', 'Meme']:
            type_data = [item for item in data if item.get('asset_type') == asset_type]
            if type_data:
                filename = f"{asset_type.lower()}_data.json"
                collector.save_to_json(type_data, filename)
        
        print("\n✅ 收集完成!")
    else:
        print("\n❌ 未能收集到数据")


if __name__ == "__main__":
    asyncio.run(main())