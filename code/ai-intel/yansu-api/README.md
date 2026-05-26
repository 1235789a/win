# Yansu API - Workflow Automation Service

> An API-first workflow automation service that generates production-ready code from natural language descriptions. Perfect for embedding in your existing AI tools website!

## 🎯 Key Features

### ✅ No Subscription - Pay As You Go
- **Starter Pack**: $9 for 50 credits
- **Basic Pack**: $29 for 200 credits
- **Pro Pack**: $99 for 1,000 credits
- **Enterprise Pack**: $299 for 5,000 credits

### 🚀 API-First Design
- RESTful API with JSON responses
- Bearer token authentication
- Webhook support for async results
- Multiple SDK options (coming soon)

### 🎨 Easy Embedding
- Drop-in widget for your website
- Iframe integration
- Custom branding support

## 📁 Project Structure

```
yansu-api/
├── src/
│   ├── index.ts                 # Entry point
│   ├── middleware/
│   │   └── auth.ts             # Authentication
│   ├── routes/
│   │   ├── workflows.ts        # Workflow generation
│   │   ├── recording.ts        # Screen recording (future)
│   │   ├── account.ts          # Account management
│   │   └── payments.ts         # Stripe integration
│   └── services/
│       ├── workflowGenerator.ts # AI code generation
│       ├── billing.ts          # Credit management
│       ├── user.ts             # User management
│       └── db.ts               # Database layer
├── embed/
│   └── yansu-widget.html       # Embeddable widget
├── package.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd yansu-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Development Server

```bash
npm run dev
```

## 📡 API Endpoints

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/workflows/generate | Generate workflow from description |
| GET | /v1/workflows/:id/status | Get generation status |

### Recording (Future Feature)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/recording/sessions | Create recording session |
| POST | /v1/recording/sessions/:id/actions | Record user actions |
| POST | /v1/recording/sessions/:id/complete | Finish and generate code |

### Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/account/balance | Get credit balance |
| GET | /v1/account/api-keys | List API keys |
| POST | /v1/account/api-keys | Create new API key |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/payments/packages | Get pricing packages |
| POST | /v1/payments/create-checkout-session | Create Stripe checkout |
| POST | /v1/payments/webhook | Stripe webhook endpoint |

## 🔧 Usage Example

### JavaScript Client

```javascript
const YANSU_API_KEY = 'your_api_key';
const YANSU_API_URL = 'https://api.yansu.io/v1';

// Generate workflow
const response = await fetch(`${YANSU_API_URL}/workflows/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YANSU_API_KEY}`
  },
  body: JSON.stringify({
    description: 'Log into Gmail and download the latest attachment',
    language: 'javascript',
    framework: 'playwright',
    detailed: true
  })
});

const data = await response.json();
console.log('Workflow ID:', data.workflow_id);
```

### Using the Embedded Widget

Add this to your website:

```html
<div id="yansu-widget"></div>

<script src="https://cdn.yansu.io/embed/v1.js"></script>
<script>
Yansu.init({
  apiKey: 'your_api_key',
  container: '#yansu-widget',
  theme: {
    primaryColor: '#4f46e5',
    backgroundColor: '#ffffff'
  }
});
</script>
```

## 💰 Pricing Model

### Cost Structure
- **AI API Cost**: ~$0.05 per generation
- **Infrastructure**: ~$0.01 per generation
- **Total Cost**: ~$0.06 per generation

### Profit Margins
| Package | Price | Credits | Cost | Profit |
|---------|-------|---------|------|--------|
| Starter | $9 | 50 | $3 | $6 |
| Basic | $29 | 200 | $12 | $17 |
| Pro | $99 | 1,000 | $60 | $39 |
| Enterprise | $299 | 5,000 | $300 | -$1 (adjust to 4,000 credits) |

## 📊 Market Opportunity

### Target Users
1. **Developers** - Need automation for repetitive tasks
2. **QA Engineers** - Need browser testing scripts
3. **Startup Founders** - Need to automate workflows
4. **Power Users** - Want to automate personal tasks

### Total Addressable Market
- **Browser Automation Tools Market**: ~$5B by 2028
- **AI Developer Tools Market**: ~$15B by 2028
- **Opportunity**: Serve 0.1% = $5-15M ARR

## 🛣️ Roadmap

### Phase 1: MVP (Months 1-2)
- [x] API design
- [x] Description-to-code generation
- [x] Stripe payment integration
- [x] Embeddable widget
- [ ] PostgreSQL database
- [ ] Production deployment

### Phase 2: Recording (Months 3-4)
- [ ] Browser extension recorder
- [ ] Action sequence processing
- [ ] Pattern recognition
- [ ] Advanced code generation

### Phase 3: Growth (Months 5-12)
- [ ] Partner program
- [ ] SDKs (JS, Python, Go)
- [ ] Advanced features
- [ ] Enterprise support

## 🔑 Success Factors

1. **Start Simple** - Launch with description-to-code first
2. **Great Documentation** - Developers choose based on docs
3. **Developer Experience** - Fast API, clear errors, good examples
4. **Transparent Pricing** - No hidden fees, clear value
5. **Community Building** - Discord, GitHub, tutorials

## 🎯 Why This Is A Great Opportunity

### ✅ No Subscription Lock-In
Users love one-time purchases! They hate recurring fees.

### ✅ Perfect For Your Website
Embed directly into your existing AI tools site for additional revenue.

### ✅ High Margins
Once built, marginal cost is almost zero.

### ✅ Real Pain Point
Every developer has repetitive tasks they hate doing.

### ✅ Build-Time, Sell-Infinite
Perfect "build once, sell forever" product!

## 📞 Need Help?

If you need help launching Yansu API or customizing it for your website, let's work together!

---

**Built with ❤️ for developers**
