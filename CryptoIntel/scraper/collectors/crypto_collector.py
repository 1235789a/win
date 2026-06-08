#!/usr/bin/env python3
"""
加密项目营销数据收集器
基于 Agent-Reach 架构
"""

import json
import random
import subprocess
import shutil
import argparse
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path


class CryptoMarketingCollector:
    """加密项目营销数据收集器"""
    
    # 加密项目 Twitter 账号列表
    CRYPTO_ACCOUNTS = [
        # Layer 1
        "Bitcoin", "ethereum", "VitalikButerin", "saylor",
        # 交易所
        "Coinbase", "binance", "CryptoCom", "OKX", "krakenfx",
        # Layer 2
        "Solana", "Cardano", "Polkadot", "Avalanche", "Polygon",
        # DeFi
        "chainlink", "Uniswap", "AaveAave", "MakerDAO", "CompoundDAO",
        # L2 Rollups
        "arbitrum", "Optimism", "ZkSync", "StarkNet", "base",
        # Meme
        "dogecoin", "Shibtoken", "PepeCoinETH", "BonkToken", "floki",
    ]
    
    # Reddit 加密版块
    CRYPTO_SUBREDDITS = [
        "cryptocurrency", "CryptoCurrency", "CryptoMarkets",
        "altcoin", "Bitcoin", "ethereum", "Defi",
        "solana", "cardano", "Polkadot", "avalanche"
    ]
    
    def __init__(self):
        self.twitter_available = bool(shutil.which("twitter"))
        self.rdt_available = bool(shutil.which("rdt"))
        self.ytdlp_available = bool(shutil.which("yt-dlp"))
    
    def collect_all(self, limit_per_source: int = 20) -> List[Dict]:
        """收集所有平台的加密项目营销数据"""
        print("=" * 60)
        print("开始收集加密项目营销数据")
        print("=" * 60)
        
        all_data = []
        
        # 收集 Twitter 数据
        if self.twitter_available:
            print("\n🐦 收集 Twitter 数据...")
            twitter_data = self._collect_twitter(limit_per_source)
            all_data.extend(twitter_data)
            print(f"   ✅ 获取 {len(twitter_data)} 条 Twitter 数据")
        else:
            print("\n⚠️ Twitter CLI 未安装，跳过")
        
        # 收集 Reddit 数据
        if self.rdt_available:
            print("\n📦 收集 Reddit 数据...")
            reddit_data = self._collect_reddit(limit_per_source)
            all_data.extend(reddit_data)
            print(f"   ✅ 获取 {len(reddit_data)} 条 Reddit 数据")
        else:
            print("\n⚠️ Reddit CLI 未安装，跳过")
        
        print("\n" + "=" * 60)
        print(f"总计收集 {len(all_data)} 条数据")
        print("=" * 60)
        
        return all_data
    
    def _collect_twitter(self, limit: int) -> List[Dict]:
        """使用 twitter-cli 收集 Twitter 数据"""
        data = []
        accounts = random.sample(self.CRYPTO_ACCOUNTS, min(10, len(self.CRYPTO_ACCOUNTS)))
        
        for account in accounts:
            try:
                r = subprocess.run(
                    ["twitter", "user", account, "-n", str(limit), "--json"],
                    capture_output=True,
                    encoding="utf-8",
                    timeout=30
                )
                
                if r.returncode == 0:
                    tweets = json.loads(r.stdout)
                    for tweet in tweets:
                        data.append({
                            "platform": "twitter",
                            "project_name": account,
                            "project_url": f"https://x.com/{account}",
                            "post_url": tweet.get("url", ""),
                            "image_url": "",
                            "date": tweet.get("created_at", ""),
                            "engagement": {
                                "likes": tweet.get("likes", 0),
                                "retweets": tweet.get("retweets", 0),
                                "replies": tweet.get("replies", 0),
                                "views": tweet.get("views", 0)
                            },
                            "asset_type": self._classify_asset_type(tweet.get("text", "")),
                            "post_text": tweet.get("text", ""),
                            "collected_at": datetime.now().isoformat(),
                            "source": "agent-reach"
                        })
            except Exception as e:
                print(f"   ⚠️ 获取 {account} 失败: {e}")
        
        return data
    
    def _collect_reddit(self, limit: int) -> List[Dict]:
        """使用 rdt-cli 收集 Reddit 数据"""
        data = []
        
        for subreddit in self.CRYPTO_SUBREDDITS[:5]:
            try:
                r = subprocess.run(
                    ["rdt", "subreddit", subreddit, "--limit", str(limit), "--json"],
                    capture_output=True,
                    encoding="utf-8",
                    timeout=30
                )
                
                if r.returncode == 0:
                    posts = json.loads(r.stdout)
                    for post in posts:
                        data.append({
                            "platform": "reddit",
                            "project_name": f"r/{subreddit}",
                            "project_url": f"https://reddit.com/r/{subreddit}",
                            "post_url": post.get("url", ""),
                            "image_url": post.get("thumbnail", ""),
                            "date": post.get("created_at", ""),
                            "engagement": {
                                "score": post.get("score", 0),
                                "comments": post.get("num_comments", 0)
                            },
                            "asset_type": self._classify_asset_type(post.get("title", "")),
                            "post_text": post.get("title", ""),
                            "collected_at": datetime.now().isoformat(),
                            "source": "agent-reach"
                        })
            except Exception as e:
                print(f"   ⚠️ 获取 r/{subreddit} 失败: {e}")
        
        return data
    
    def _classify_asset_type(self, text: str) -> str:
        """分类资产类型"""
        if not text:
            return "Other"
        
        text_lower = text.lower()
        
        if any(k in text_lower for k in ["ama", "ask me anything"]):
            return "AMA"
        elif any(k in text_lower for k in ["airdrop", "free token", "claim"]):
            return "Airdrop"
        elif any(k in text_lower for k in ["partnership", "collaboration"]):
            return "Partnership"
        elif any(k in text_lower for k in ["listing", "exchange"]):
            return "Listing"
        elif any(k in text_lower for k in ["giveaway", "win", "prize"]):
            return "Giveaway"
        elif any(k in text_lower for k in ["meme", "funny"]):
            return "Meme"
        else:
            return "Other"
    
    def print_statistics(self, data: List[Dict]):
        """打印统计信息"""
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
            print(f"   {asset_type}: {count}")
        
        print("\n📊 按平台:")
        for platform, count in sorted(platform_count.items()):
            print(f"   {platform}: {count}")
        
        print("=" * 60)
    
    def save_to_json(self, data: List[Dict], filename: str):
        """保存数据到 JSON 文件"""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 数据已保存到 {filename}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="加密项目营销数据收集器")
    parser.add_argument("--limit", type=int, default=20, help="每个来源的收集数量")
    parser.add_argument("--output", type=str, default="../data/raw.json", help="输出文件路径")
    args = parser.parse_args()
    
    print("=" * 60)
    print("加密项目营销数据收集器")
    print("基于 Agent-Reach 架构")
    print("=" * 60)
    
    # 创建收集器
    collector = CryptoMarketingCollector()
    
    # 检查工具状态
    print("\n🩺 检查上游工具状态...")
    print(f"   Twitter CLI: {'✅' if collector.twitter_available else '❌'}")
    print(f"   Reddit CLI: {'✅' if collector.rdt_available else '❌'}")
    print(f"   yt-dlp: {'✅' if collector.ytdlp_available else '❌'}")
    
    # 收集数据
    data = collector.collect_all(args.limit)
    
    if data:
        # 打印统计
        collector.print_statistics(data)
        
        # 保存数据
        collector.save_to_json(data, args.output)
        
        print("\n✅ 收集完成!")
    else:
        print("\n❌ 未能收集到数据")
        print("\n提示:")
        print("1. 配置 Twitter 认证:")
        print("   export TWITTER_AUTH_TOKEN='your_token'")
        print("   export TWITTER_CT0='your_ct0'")
        print("2. 配置 Reddit 认证:")
        print("   rdt login")


if __name__ == "__main__":
    main()