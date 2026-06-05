#!/usr/bin/env python3
"""
模拟数据生成器 - 用于演示加密项目营销数据收集
"""

import random
import json
from datetime import datetime, timedelta

class MarketingDataGenerator:
    """
    营销数据生成器
    """
    
    def __init__(self):
        self.projects = [
            'Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polkadot',
            'Avalanche', 'Polygon', 'Cosmos', 'Chainlink', 'Uniswap',
            'SushiSwap', 'PancakeSwap', 'Aave', 'Compound', 'MakerDAO',
            'Arbitrum', 'Optimism', 'ZkSync', 'StarkNet', 'Base',
            'Dogecoin', 'Shiba Inu', 'Pepe', 'Bonk', 'Floki',
            'Axie Infinity', 'Decentraland', 'The Sandbox', 'Enjin', 'Flow',
            'Filecoin', 'Stellar', 'Ripple', 'Litecoin', 'BCH',
            'Monero', 'Zcash', 'Dash', 'Decred', 'Nano'
        ]
        
        self.asset_types = ['AMA', 'Airdrop', 'Partnership', 'Listing', 'Giveaway', 'Meme']
        
        self.templates = {
            'AMA': [
                "Join our AMA with the core team! Ask us anything about {project}",
                "AMA happening tomorrow at 2PM UTC with {project} founder",
                "Don't miss our live AMA session about the upcoming update",
                "{project} is hosting an AMA next week - submit your questions!",
                "Recap from our AMA with the community yesterday"
            ],
            'Airdrop': [
                "Big airdrop announcement! Claim your free {project} tokens now",
                "Exclusive airdrop for early supporters of {project}",
                "Limited time airdrop - 50,000 {project} tokens up for grabs",
                "New airdrop alert! Complete tasks to earn {project} tokens",
                "Snapshot for the {project} airdrop is happening on Friday"
            ],
            'Partnership': [
                "Huge news! {project} partners with major DeFi protocol",
                "Partnership announcement: {project} x ProtocolName",
                "We're thrilled to announce our partnership with {project}",
                "{project} teams up with leading Web3 platform",
                "Strategic partnership between {project} and ExchangeName"
            ],
            'Listing': [
                "{project} is now listed on ExchangeName!",
                "Listing alert! {project} available for trading on major exchange",
                "We're excited to announce {project} listing on ExchangePlatform",
                "Big milestone: {project} listed on TopExchange",
                "{project} trading goes live on multiple exchanges"
            ],
            'Giveaway': [
                "Giving away $10,000 worth of {project} tokens to celebrate!",
                "Huge giveaway: Win exclusive NFTs from {project}",
                "Participate in our {project} giveaway and win big prizes",
                "Community giveaway: 100 lucky winners get {project} rewards",
                "Celebration giveaway from {project} - join now!"
            ],
            'Meme': [
                "Check out this hilarious meme about {project}",
                "New {project} meme dropping this week",
                "This {project} meme is going viral",
                "Community-made meme about {project}",
                "The best {project} memes compiled here"
            ]
        }
    
    def random_date(self, days_back=90):
        """
        生成随机日期（最近90天内）
        """
        days = random.randint(0, days_back)
        date = datetime.now() - timedelta(days=days)
        return date.isoformat()
    
    def random_engagement(self):
        """
        生成随机互动数据
        """
        return {
            'likes': random.randint(10, 5000),
            'retweets': random.randint(5, 1000),
            'replies': random.randint(2, 500),
            'views': random.randint(100, 50000)
        }
    
    def generate_post(self, asset_type=None):
        """
        生成单个帖子
        """
        if not asset_type:
            asset_type = random.choice(self.asset_types)
        
        project = random.choice(self.projects)
        template = random.choice(self.templates[asset_type])
        
        post_text = template.format(project=project)
        
        return {
            'project_name': project,
            'project_url': f"https://example.com/{project.lower()}",
            'post_url': f"https://example.com/post/{random.randint(100000, 999999)}",
            'image_url': f"https://example.com/images/{random.randint(1, 100)}.jpg" if random.random() > 0.3 else '',
            'date': self.random_date(),
            'engagement': self.random_engagement(),
            'asset_type': asset_type,
            'post_text': post_text
        }
    
    def generate_batch(self, count=100):
        """
        生成一批数据
        """
        data = []
        
        # 确保每种类型至少有一些
        type_distribution = {
            'AMA': 13,
            'Airdrop': 17,
            'Partnership': 18,
            'Listing': 18,
            'Giveaway': 20,
            'Meme': 14
        }
        
        for asset_type, count_type in type_distribution.items():
            for _ in range(count_type):
                data.append(self.generate_post(asset_type))
        
        # 打乱顺序
        random.shuffle(data)
        
        return data

if __name__ == "__main__":
    generator = MarketingDataGenerator()
    
    print("="*60)
    print("加密项目营销数据生成器")
    print("="*60)
    
    data = generator.generate_batch(100)
    
    print(f"\n✓ 生成了 {len(data)} 条营销数据")
    
    # 统计类型
    type_count = {}
    for item in data:
        asset_type = item['asset_type']
        type_count[asset_type] = type_count.get(asset_type, 0) + 1
    
    print("\n类型统计:")
    for asset_type, count in sorted(type_count.items()):
        print(f"  {asset_type}: {count}")
    
    # 保存数据
    with open('marketing_sample_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 数据已保存到 marketing_sample_data.json")