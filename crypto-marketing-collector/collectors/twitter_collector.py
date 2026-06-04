"""
Twitter (X) Collector
Collects tweets from official crypto project accounts
"""

import os
import tweepy
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()


class TwitterCollector:
    def __init__(self):
        self.api_key = os.getenv("TWITTER_API_KEY")
        self.api_secret = os.getenv("TWITTER_API_SECRET")
        self.access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.access_secret = os.getenv("TWITTER_ACCESS_SECRET")
        self.bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        
        self.client = None
        self._init_client()
    
    def _init_client(self):
        if self.bearer_token:
            self.client = tweepy.Client(bearer_token=self.bearer_token)
    
    def collect_from_account(self, username: str, max_tweets: int = 100):
        """Collect tweets from a specific account"""
        if not self.client:
            return []
        
        try:
            # Get user ID
            user = self.client.get_user(username=username)
            if not user.data:
                return []
            
            user_id = user.data.id
            
            # Calculate date 90 days ago
            start_date = datetime.utcnow() - timedelta(days=90)
            
            # Get tweets
            tweets = self.client.get_users_tweets(
                id=user_id,
                max_results=min(max_tweets, 100),
                tweet_fields=["created_at", "public_metrics", "entities", "attachments"],
                start_time=start_date.isoformat() + "Z"
            )
            
            results = []
            if tweets.data:
                for tweet in tweets.data:
                    results.append(self._format_tweet(tweet, username))
            
            return results
        except Exception as e:
            print(f"Error collecting from {username}: {e}")
            return []
    
    def _format_tweet(self, tweet, username):
        """Format tweet into our schema"""
        image_url = ""
        if hasattr(tweet, 'attachments') and tweet.attachments:
            if 'media_keys' in tweet.attachments:
                # Would need additional call to get media
                pass
        
        public_metrics = tweet.public_metrics if hasattr(tweet, 'public_metrics') else {}
        
        return {
            "project_name": username,
            "project_url": f"https://twitter.com/{username}",
            "post_url": f"https://twitter.com/{username}/status/{tweet.id}",
            "image_url": image_url,
            "date": tweet.created_at.isoformat() if tweet.created_at else "",
            "engagement": {
                "likes": public_metrics.get('like_count', 0),
                "retweets": public_metrics.get('retweet_count', 0),
                "replies": public_metrics.get('reply_count', 0),
                "views": public_metrics.get('impression_count', 0)
            },
            "asset_type": "Unknown",  # To be classified later
            "post_text": tweet.text
        }
