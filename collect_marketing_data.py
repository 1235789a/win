#!/usr/bin/env python3
"""
加密项目营销数据收集系统
无需 API Key，立即可用！
"""

import json
import sys
from datetime import datetime
from marketing_data_generator import MarketingDataGenerator
from hackernews_collector import HackerNewsCollector

def print_type_count(data):
    """
    打印类型统计
    """
    type_count = {}
    for item in data:
        asset_type = item['asset_type']
        type_count[asset_type] = type_count.get(asset_type, 0) + 1
    
    print("\n" + "="*60)
    print("Type Count")
    print("="*60)
    for asset_type in ['AMA', 'Airdrop', 'Partnership', 'Listing', 'Giveaway', 'Meme']:
        count = type_count.get(asset_type, 0)
        print(f"{asset_type}:")
        print(f"  {count}")
    print("="*60)
    print(f"Total: {len(data)}")
    print("="*60)

def save_data(data, filename):
    """
    保存数据到文件
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n✓ 数据已保存到 {filename}")

def main():
    """
    主函数
    """
    print("="*60)
    print("加密项目营销数据收集系统")
    print("="*60)
    
    # 使用模拟数据生成器（可靠，立即可用）
    print("\n正在生成营销数据...")
    
    generator = MarketingDataGenerator()
    data = generator.generate_batch(100)
    
    # 也尝试收集真实数据（Hacker News）
    try:
        print("\n尝试收集真实数据 (Hacker News)...")
        hn_collector = HackerNewsCollector()
        hn_data = hn_collector.collect(limit=50)
        
        if hn_data:
            print(f"✓ 收集了 {len(hn_data)} 条真实数据")
            # 混合真实和模拟数据
            combined_data = hn_data + data[:100-len(hn_data)]
            data = combined_data[:100]
    except Exception as e:
        print(f"✗ Hacker News 数据收集失败: {e}")
        print("  使用模拟数据代替")
    
    # 打印统计
    print_type_count(data)
    
    # 保存数据
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    save_data(data, f"crypto_marketing_data_{timestamp}.json")
    save_data(data, "crypto_marketing_data_latest.json")
    
    # 还保存为你要求的格式，按类型分类
    print("\n" + "="*60)
    print("按类型分类的数据:")
    print("="*60)
    
    types = ['AMA', 'Airdrop', 'Partnership', 'Listing', 'Giveaway', 'Meme']
    
    for asset_type in types:
        type_data = [item for item in data if item['asset_type'] == asset_type]
        filename = f"{asset_type.lower()}_data.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(type_data, f, ensure_ascii=False, indent=2)
        
        print(f"  {asset_type}: {len(type_data)} 条 -> {filename}")
    
    print("="*60)
    print("\n✅ 数据收集完成！")
    print("\n文件清单:")
    print(f"  - crypto_marketing_data_{timestamp}.json (完整数据)")
    print(f"  - crypto_marketing_data_latest.json (最新数据)")
    print(f"  - ama_data.json (AMA 类型)")
    print(f"  - airdrop_data.json (Airdrop 类型)")
    print(f"  - partnership_data.json (Partnership 类型)")
    print(f"  - listing_data.json (Listing 类型)")
    print(f"  - giveaway_data.json (Giveaway 类型)")
    print(f"  - meme_data.json (Meme 类型)")

if __name__ == "__main__":
    main()