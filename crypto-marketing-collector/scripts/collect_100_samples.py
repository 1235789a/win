#!/usr/bin/env python3
"""
24-Hour MVP: Collect 100 Samples
Simple script to collect 100 samples from crypto projects
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random


# Sample crypto project Twitter accounts
SAMPLE_PROJECTS = [
    "Bitcoin",
    "ethereum",
    "solana",
    "Cardano",
    "Polkadot",
    "cosmos",
    "avalancheavax",
    "Chainlink",
    "Uniswap",
    "aaveaave"
]


def generate_mock_samples(n: int = 100):
    """Generate mock samples for demonstration"""
    samples = []
    asset_types = ["AMA", "Airdrop", "Partnership", "Listing", "Giveaway", "Meme"]
    
    for i in range(n):
        project = random.choice(SAMPLE_PROJECTS)
        asset_type = random.choice(asset_types)
        days_ago = random.randint(0, 90)
        date = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        sample = {
            "project_name": project,
            "project_url": f"https://twitter.com/{project}",
            "post_url": f"https://twitter.com/{project}/status/{random.randint(1000000000, 9999999999)}",
            "image_url": f"https://example.com/image{i}.jpg",
            "date": date,
            "engagement": {
                "likes": random.randint(100, 10000),
                "retweets": random.randint(50, 2000),
                "replies": random.randint(20, 500),
                "views": random.randint(10000, 1000000)
            },
            "asset_type": asset_type,
            "post_text": f"Sample {asset_type} post from {project}..."
        }
        samples.append(sample)
    
    return samples


def print_type_counts(records: list):
    """Print counts by asset type"""
    counts = {
        "AMA": 0,
        "Airdrop": 0,
        "Partnership": 0,
        "Listing": 0,
        "Giveaway": 0,
        "Meme": 0
    }
    
    for record in records:
        atype = record.get("asset_type")
        if atype in counts:
            counts[atype] += 1
    
    print("=" * 50)
    print("Type Count")
    print("=" * 50)
    for atype, count in counts.items():
        print(f"{atype}:")
        print(f"  {count}")
    print("=" * 50)
    print(f"Total: {len(records)}")


def main():
    print("=" * 50)
    print("Crypto Marketing Data Collector - 100 Samples MVP")
    print("=" * 50)
    
    # Generate mock data (replace with real API calls when you have keys)
    print("\nGenerating 100 samples...")
    samples = generate_mock_samples(100)
    
    # Save to file
    from storage.database import SimpleJSONStorage
    storage = SimpleJSONStorage()
    filepath = storage.save(samples, "sample_100.json")
    print(f"\nSaved to: {filepath}")
    
    # Print counts
    print_type_counts(samples)
    
    print("\nDone!")
    print("\nNote: This generates mock data. To collect real data:")
    print("1. Get your API keys (see ../API-COLLECTION-GUIDE.md)")
    print("2. Configure .env file")
    print("3. Uncomment and use the real collector code")


if __name__ == "__main__":
    main()
