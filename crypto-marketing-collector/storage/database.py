"""
Database Storage
Handles storing collected data
"""

import json
import os
from datetime import datetime


class SimpleJSONStorage:
    def __init__(self, data_dir: str = "data/processed"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
    
    def save(self, records: list, filename: str = None):
        """Save records to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"collected_{timestamp}.json"
        
        filepath = os.path.join(self.data_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        
        return filepath
    
    def load(self, filepath: str):
        """Load records from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_type_counts(self, records: list) -> dict:
        """Count assets by type"""
        counts = {
            "AMA": 0,
            "Airdrop": 0,
            "Partnership": 0,
            "Listing": 0,
            "Giveaway": 0,
            "Meme": 0,
            "Unknown": 0
        }
        
        for record in records:
            asset_type = record.get("asset_type", "Unknown")
            if asset_type in counts:
                counts[asset_type] += 1
        
        return counts
