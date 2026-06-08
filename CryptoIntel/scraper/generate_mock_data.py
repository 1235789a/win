#!/usr/bin/env python3
"""
模拟数据生成器 - 用于演示系统输出
"""

import json
import random
from datetime import datetime, timedelta

class MockDataGenerator:
    """生成模拟数据用于测试"""
    
    PROJECTS = [
        "Bitcoin", "Ethereum", "Solana", "Cardano", "Polkadot",
        "Avalanche", "Polygon", "Chainlink", "Uniswap", "Aave",
        "MakerDAO", "Arbitrum", "Optimism", "ZkSync", "Base",
        "Dogecoin", "Shiba Inu", "Pepe", "Bonk", "Floki"
    ]
    
    ASSET_TYPES = ["AMA", "Airdrop", "Partnership", "Listing", "Giveaway", "Meme"]
    
    TEMPLATES = {
        "AMA": [
            "Join our AMA with {project} team! Ask us anything about the upcoming update",
            "Live AMA happening tomorrow at 2PM UTC with {project} founder",
            "Don't miss our AMA session - Submit your questions now!",
            "Recap from yesterday's AMA with the {project} community"
        ],
        "Airdrop": [
            "Big airdrop announcement! Claim your free {project} tokens now",
            "Exclusive airdrop for early supporters - {project} distribution",
            "Limited time airdrop: 50,000 {project} tokens up for grabs",
            "New airdrop alert! Complete tasks to earn {project} tokens"
        ],
        "Partnership": [
            "Huge news! {project} partners with leading DeFi protocol",
            "Partnership announcement: {project} x Protocol",
            "Strategic partnership between {project} and Exchange",
            "{project} teams up with major blockchain platform"
        ],
        "Listing": [
            "{project} is now listed on major exchanges!",
            "Listing alert! {project} available for trading",
            "Big milestone: {project} launches on TopExchange",
            "{project} trading goes live - Celebrating with bonus!"
        ],
        "Giveaway": [
            "Giving away $10,000 worth of {project} to celebrate!",
            "Huge giveaway: Win exclusive NFTs from {project}",
            "Community giveaway: 100 winners get {project} rewards",
            "Celebration giveaway from {project} - Join now!"
        ],
        "Meme": [
            "Check out this hilarious {project} meme",
            "New {project} meme going viral",
            "The best {project} memes compiled",
            "Community-made meme about {project}"
        ]
    }
    
    def generate(self, count=100):
        """生成模拟数据"""
        data = []
        
        # 按比例分配
        distribution = {
            "AMA": 13,
            "Airdrop": 17,
            "Partnership": 18,
            "Listing": 18,
            "Giveaway": 20,
            "Meme": 14
        }
        
        for asset_type, type_count in distribution.items():
            for _ in range(type_count):
                data.append(self._generate_item(asset_type))
        
        random.shuffle(data)
        return data[:count]
    
    def _generate_item(self, asset_type):
        """生成单个数据项"""
        project = random.choice(self.PROJECTS)
        template = random.choice(self.TEMPLATES[asset_type])
        post_text = template.format(project=project)
        
        days_ago = random.randint(0, 89)
        date = datetime.now() - timedelta(days=days_ago)
        
        return {
            "platform": random.choice(["twitter", "reddit"]),
            "project_name": project,
            "project_url": f"https://x.com/{project.lower()}" if random.random() > 0.5 else f"https://reddit.com/r/{project}",
            "post_url": f"https://x.com/{project.lower()}/status/{random.randint(1000000000, 9999999999)}",
            "image_url": f"https://example.com/images/{random.randint(1, 100)}.jpg" if random.random() > 0.5 else "",
            "date": date.isoformat(),
            "engagement": {
                "likes": random.randint(100, 10000),
                "retweets": random.randint(50, 5000),
                "replies": random.randint(10, 1000),
                "views": random.randint(1000, 100000)
            },
            "asset_type": asset_type,
            "post_text": post_text,
            "collected_at": datetime.now().isoformat(),
            "source": "mock-demo"
        }
    
    def print_statistics(self, data):
        """打印统计"""
        print("\n" + "=" * 60)
        print("类型统计 (Type Count)")
        print("=" * 60)
        
        type_count = {}
        platform_count = {}
        
        for item in data:
            asset_type = item.get("asset_type", "Other")
            type_count[asset_type] = type_count.get(asset_type, 0) + 1
            
            platform = item.get("platform", "unknown")
            platform_count[platform] = platform_count.get(platform, 0) + 1
        
        print("\n📊 按类型:")
        for asset_type in ["AMA", "Airdrop", "Partnership", "Listing", "Giveaway", "Meme", "Other"]:
            count = type_count.get(asset_type, 0)
            bar = "█" * (count // 2) if count > 0 else ""
            print(f"   {asset_type:12s}: {count:3d} {bar}")
        
        print("\n📊 按平台:")
        for platform, count in sorted(platform_count.items()):
            bar = "█" * (count // 5) if count > 0 else ""
            print(f"   {platform:12s}: {count:3d} {bar}")
        
        print("\n📊 互动统计:")
        total_likes = sum(item["engagement"]["likes"] for item in data)
        total_retweets = sum(item["engagement"]["retweets"] for item in data)
        total_replies = sum(item["engagement"]["replies"] for item in data)
        
        print(f"   总点赞: {total_likes:,}")
        print(f"   总转发: {total_retweets:,}")
        print(f"   总回复: {total_replies:,}")
        
        print("=" * 60)


def main():
    """主函数"""
    print("=" * 60)
    print("CryptoIntel 模拟数据生成器")
    print("用于演示系统输出格式")
    print("=" * 60)
    
    # 生成100条模拟数据
    generator = MockDataGenerator()
    data = generator.generate(100)
    
    # 打印统计
    generator.print_statistics(data)
    
    # 保存数据
    output_file = "/workspace/CryptoIntel/data/mock_raw.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 数据已保存到: {output_file}")
    
    # 显示样本数据
    print("\n" + "=" * 60)
    print("样本数据预览 (前3条)")
    print("=" * 60)
    
    for i, item in enumerate(data[:3], 1):
        print(f"\n--- 样本 {i} ---")
        print(f"平台: {item['platform']}")
        print(f"项目: {item['project_name']}")
        print(f"类型: {item['asset_type']}")
        print(f"日期: {item['date']}")
        print(f"内容: {item['post_text'][:80]}...")
        print(f"互动: ❤️{item['engagement']['likes']} 🔄{item['engagement']['retweets']} 💬{item['engagement']['replies']}")


if __name__ == "__main__":
    main()