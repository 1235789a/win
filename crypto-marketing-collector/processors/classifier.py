"""
Asset Type Classifier
Classifies posts into asset types
"""

import re


class AssetClassifier:
    KEYWORDS = {
        "AMA": ["ama", "ask me anything", "twitter space", "live session", "q&a", "ask me"],
        "Airdrop": ["airdrop", "air drop", "token distribution", "free token", "claim tokens"],
        "Partnership": ["partnership", "collaboration", "partner with", "join forces", "strategic alliance"],
        "Listing": ["list on", "exchange listing", "new listing", "listed on"],
        "Giveaway": ["giveaway", "win", "prize", "reward", "contest", "competition"],
        "Meme": ["meme", "memes", "memecoin", "funny"]
    }
    
    @classmethod
    def classify(cls, text: str) -> str:
        """Classify text into asset type"""
        text_lower = text.lower()
        
        for asset_type, keywords in cls.KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return asset_type
        
        return "Unknown"
