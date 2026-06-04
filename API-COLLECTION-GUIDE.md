# API Collection Guide for Crypto Marketing Data Collection

## Overview
This guide helps you collect and manage all necessary APIs for crypto marketing data collection from official sources.

---

## 1. Twitter API (X API) v2

### How to Get API Keys
1. Go to: https://developer.twitter.com/
2. Sign up for a Developer Account
3. Create a Project and App
4. Get your API keys from the "Keys and tokens" page

### Required Credentials
- API Key
- API Secret Key
- Access Token
- Access Token Secret
- Bearer Token

### Free Tier Limits
- 500,000 tweets/month
- Rate limits apply

---

## 2. Telegram Bot API

### How to Get API Token
1. Open Telegram and search for @BotFather
2. Send `/newbot` to create a new bot
3. Follow the instructions
4. @BotFather will give you a token

### Bot Permissions Needed
- Access to messages
- Read channel history (for public channels)

### API Documentation
https://core.telegram.org/bots/api

---

## 3. Discord API

### How to Get Bot Token
1. Go to: https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" section and click "Add Bot"
4. Click "Reset Token" to get your token
5. Enable "Privileged Gateway Intents" as needed

### Invite Bot to Server
Use OAuth2 URL Generator with `bot` scope and necessary permissions

### API Documentation
https://discord.com/developers/docs/intro

---

## 4. Medium API

### How to Get Integration Token
1. Go to: https://medium.com/me/settings
2. Scroll to "Integration tokens"
3. Click "Get integration token"
4. Follow the instructions

### RSS Feed Alternative
For public posts, use RSS feeds:
`https://medium.com/feed/@username`

---

## 5. Official Blog (Custom)

### Methods
1. RSS Feed (if available)
2. Web Scraping (respect robots.txt)
3. Custom API (if provided)

---

## Save Your API Keys

### File Format
Save your API keys in a secure file (e.g., `api-keys.txt` on Desktop):

```
=== TWITTER API ===
API Key: YOUR_API_KEY
API Secret: YOUR_API_SECRET
Access Token: YOUR_ACCESS_TOKEN
Access Token Secret: YOUR_ACCESS_TOKEN_SECRET
Bearer Token: YOUR_BEARER_TOKEN

=== TELEGRAM BOT API ===
Bot Token: YOUR_TELEGRAM_BOT_TOKEN

=== DISCORD API ===
Bot Token: YOUR_DISCORD_BOT_TOKEN

=== MEDIUM API ===
Integration Token: YOUR_MEDIUM_TOKEN
```

### Security Notes
- Never commit API keys to version control
- Use environment variables in production
- Consider using a secrets manager

---

## Next Steps with agent-browser

Once you have your API keys, you can use agent-browser to automate collection:

1. Install dependencies (if not already installed)
2. Use the API keys in your collection scripts
3. Store collected data in a database

---

## Cost Estimate Recap

### Free
- Twitter API Free Tier
- Telegram Bot API
- Discord API
- Medium RSS

### $100/month
- Twitter API Basic Tier ($100)
- Basic cloud hosting

### $500/month
- Twitter API Pro Tier ($499)
- Better hosting
- Proxy services

---

## Quick Start for 100 Samples (24 Hours)

1. Pick 10 crypto projects
2. Collect their official X/Twitter accounts
3. Use tweepy + Python to collect recent tweets
4. Manually verify and classify

---

## Contact
For issues, refer to the official documentation of each platform.
