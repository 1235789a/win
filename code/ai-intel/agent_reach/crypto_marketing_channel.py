# -*- coding: utf-8 -*-
"""
加密项目营销数据 Channel
基于 Agent-Reach 架构，收集 AMA/Airdrop/Partnership/Listing/Giveaway/Meme 数据
"""

import json
import random
import subprocess
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse


class CryptoMarketingChannel:
    """加密项目营销数据收集 Channel"""
    
    name = "crypto_marketing"
    description = "加密项目 AMA/Airdrop/Partnership/Listing/Giveaway/Meme 数据"
    backends = ["twitter-cli", "rdt-cli", "yt-dlp", "Jina Reader"]
    tier = 1  # 需要配置
    
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
        # NFT/Metaverse
        "AxieInfinity", "Decentraland", "TheSandboxGame", "enjin",
        # 其他
        "Filecoin", "StellarOrg", "Ripple", "litecoin", "Monero",
    ]
    
    # Reddit 加密版块
    CRYPTO_SUBREDDITS = [
        "cryptocurrency", "CryptoCurrency", "CryptoMarkets",
        "altcoin", "Bitcoin", "ethereum", "Defi",
        "solana", "cardano", "Polkadot", "avalanche"
    ]
    
    def can_handle(self, url: str) -> bool:
        """检查是否是加密项目相关 URL"""
        crypto_domains = [
            "x.com", "twitter.com",
            "reddit.com", "redd.it",
            "youtube.com", "youtu.be",
            "medium.com", "t.me"
        ]
        domain = urlparse(url).netloc.lower()
        return any(d in domain for d in crypto_domains)
    
    def check(self) -> Tuple[str, str]:
        """检查所有上游工具是否可用"""
        results = []
        
        twitter_status = self._check_twitter_cli()
        results.append(f"Twitter: {twitter_status}")
        
        reddit_status = self._check_rdt_cli()
        results.append(f"Reddit: {reddit_status}")
        
        youtube_status = self._check_yt_dlp()
        results.append(f"YouTube: {youtube_status}")
        
        web_status = self._check_jina_reader()
        results.append(f"Web: {web_status}")
        
        all_ok = all("ok" in r for r in results)
        status = "ok" if all_ok else "warn"
        message = "\n".join(results)
        
        return status, message
    
    def _check_twitter_cli(self) -> str:
        """检查 twitter-cli"""
        twitter = shutil.which("twitter")
        if not twitter:
            return "未安装 (pip install twitter-cli)"
        
        try:
            r = subprocess.run(
                [twitter, "status"],
                capture_output=True,
                encoding="utf-8",
                timeout=10
            )
            if "ok: true" in r.stdout:
                return "ok (已认证)"
            return "未认证 (需要配置 Cookie)"
        except Exception:
            return "检查失败"
    
    def _check_rdt_cli(self) -> str:
        """检查 rdt-cli"""
        rdt = shutil.which("rdt")
        if not rdt:
            return "未安装 (pip install rdt-cli)"
        
        try:
            r = subprocess.run(
                [rdt, "status", "--json"],
                capture_output=True,
                encoding="utf-8",
                timeout=10
            )
            data = json.loads(r.stdout)
            if data.get("data", {}).get("authenticated"):
                return "ok (已登录)"
            return "未登录 (运行 rdt login)"
        except Exception:
            return "检查失败"
    
    def _check_yt_dlp(self) -> str:
        """检查 yt-dlp"""
        ytdlp = shutil.which("yt-dlp")
        if not ytdlp:
            return "未安装 (pip install yt-dlp)"
        return "ok"
    
    def _check_jina_reader(self) -> str:
        """检查 Jina Reader"""
        # Jina Reader 是在线服务，无需安装
        return "ok (在线服务)"
    
    def collect_all(self, limit_per_source: int = 20) -> List[Dict]:
        """收集所有平台的加密项目营销数据"""
        print("\n" + "=" * 60)
        print("开始收集加密项目营销数据")
        print("=" * 60)
        
        all_data = []
        
        # 收集 Twitter 数据
        print("\n🐦 收集 Twitter 数据...")
        twitter_data = self._collect_twitter(limit_per_source)
        all_data.extend(twitter_data)
        print(f"   ✅ 获取 {len(twitter_data)} 条 Twitter 数据")
        
        # 收集 Reddit 数据
        print("\n📦 收集 Reddit 数据...")
        reddit_data = self._collect_reddit(limit_per_source)
        all_data.extend(reddit_data)
        print(f"   ✅ 获取 {len(reddit_data)} 条 Reddit 数据")
        
        print("\n" + "=" * 60)
        print(f"总计收集 {len(all_data)} 条数据")
        print("=" * 60)
        
        return all_data
    
    def _collect_twitter(self, limit: int) -> List[Dict]:
        """使用 twitter-cli 收集 Twitter 数据"""
        twitter = shutil.which("twitter")
        if not twitter:
            print("   ⚠️ twitter-cli 未安装")
            return []
        
        data = []
        accounts = random.sample(self.CRYPTO_ACCOUNTS, min(10, len(self.CRYPTO_ACCOUNTS)))
        
        for account in accounts:
            try:
                # 使用 twitter-cli 获取用户推文
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
        rdt = shutil.which("rdt")
        if not rdt:
            print("   ⚠️ rdt-cli 未安装")
            return []
        
        data = []
        
        for subreddit in self.CRYPTO_SUBREDDITS[:5]:
            try:
                # 使用 rdt-cli 获取 subreddit 帖子
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
                                "comments": post.get("num_comments", 0),
                                "upvotes": post.get("ups", 0)
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
        
        if any(keyword in text_lower for keyword in ["ama", "ask me anything", "ask hn"]):
            return "AMA"
        elif any(keyword in text_lower for keyword in ["airdrop", "free token", "claim your", "distribution"]):
            return "Airdrop"
        elif any(keyword in text_lower for keyword in ["partnership", "collaboration", "partner with", "collab"]):
            return "Partnership"
        elif any(keyword in text_lower for keyword in ["listing", "now trading", "exchange", "listed on"]):
            return "Listing"
        elif any(keyword in text_lower for keyword in ["giveaway", "win", "prize", "reward", "contest"]):
            return "Giveaway"
        elif any(keyword in text_lower for keyword in ["meme", "funny", "lol", "hilarious"]):
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
    print("=" * 60)
    print("加密项目营销数据收集器")
    print("基于 Agent-Reach 架构")
    print("=" * 60)
    
    # 创建 Channel
    channel = CryptoMarketingChannel()
    
    # 检查工具状态
    print("\n🩺 检查上游工具状态...")
    status, message = channel.check()
    print(f"\n状态: {status}")
    print(message)
    
    if status != "ok":
        print("\n⚠️ 请先安装和配置上游工具:")
        print("   pip install twitter-cli")
        print("   pip install rdt-cli")
        print("   pip install yt-dlp")
        print("\n然后配置认证:")
        print("   export TWITTER_AUTH_TOKEN='xxx'")
        print("   export TWITTER_CT0='yyy'")
        print("   rdt login")
        return
    
    # 收集数据
    data = channel.collect_all(limit_per_source=30)
    
    if data:
        # 打印统计
        channel.print_statistics(data)
        
        # 保存数据
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        channel.save_to_json(data, f"crypto_marketing_data_{timestamp}.json")
        channel.save_to_json(data, "crypto_marketing_data_latest.json")
        
        # 按类型分别保存
        for asset_type in ["AMA", "Airdrop", "Partnership", "Listing", "Giveaway", "Meme"]:
            type_data = [item for item in data if item.get("asset_type") == asset_type]
            if type_data:
                filename = f"{asset_type.lower()}_data.json"
                channel.save_to_json(type_data, filename)
        
        print("\n✅ 收集完成!")
    else:
        print("\n❌ 未能收集到数据")


if __name__ == "__main__":
    main()