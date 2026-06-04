# Complete Setup Guide

## 1. Quick Start (5 minutes)

```bash
# Navigate to the collector directory
cd /workspace/crypto-marketing-collector

# Run the sample collector
python scripts/collect_100_samples.py
```

This will generate 100 mock samples immediately.

---

## 2. Full Setup (30 minutes)

### Step 1: Install Dependencies

```bash
cd /workspace/crypto-marketing-collector
pip install -r requirements.txt
```

### Step 2: Get Your API Keys

See `API-COLLECTION-GUIDE.md` for detailed instructions.

### Step 3: Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### Step 4: Start Collecting!

```bash
# Collect 100 samples (with real data once keys are set)
python scripts/collect_100_samples.py
```

---

## 3. Cost Estimates

### Free Tier (Recommended for MVP)
- Twitter/X: 500,000 tweets/month
- Telegram, Discord, Medium: Free
- **Total: $0/month**

### Budget Tier ($100/month)
- Twitter/X Basic Tier: $100/month
- Basic cloud hosting
- **Total: ~$100/month**

### Pro Tier ($500/month)
- Twitter/X Pro Tier: $499/month
- Better hosting
- Proxy services
- **Total: ~$500/month**

---

## 4. What's Included

```
/workspace/
├── API-COLLECTION-GUIDE.md    # How to get API keys
├── COLLECTION-ARCHITECTURE.md # Complete system design
├── SETUP-GUIDE.md             # This file
├── API-KEYS-TEMPLATE.md       # Template for your keys
└── crypto-marketing-collector/  # Working code!
    ├── collectors/           # Data collectors
    ├── processors/           # Data processing
    ├── storage/              # Data storage
    ├── scripts/              # Run scripts
    └── data/                 # Collected data
```

---

## 5. Next Steps

1. **24-Hour MVP:** Run `collect_100_samples.py` (already works!)
2. **7-Day Plan:** Add Telegram & Discord collectors
3. **30-Day Plan:** Scale to 10,000 samples with PostgreSQL

---

Need help? Check the documentation files!
