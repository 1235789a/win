# Yansu API - 工作流自动化API

## 🎯 产品定位
面向开发者的工作流自动化API，可嵌入任何AI工具站

## 💰 非订阅制定价（按次付费）

| 方案 | 价格 | 调用次数 | 适用场景 |
|------|------|----------|----------|
| **Starter Pack** | $9 | 100次 | 个人开发者测试 |
| **Basic Pack** | $29 | 500次 | 小型SaaS集成 |
| **Pro Pack** | $99 | 2,000次 | 中型应用 |
| **Enterprise Pack** | $299 | 10,000次 | 企业级应用 |
| **Volume Pricing** | 联系我们 | 自定义 | 海量调用 |

### 定价优势
- **无订阅锁定**：买一次用一次，用户喜欢
- **易于理解**：海外用户习惯这种模型（类似OpenAI）
- **适合嵌入**：其他工具可以按使用量付费集成

---

## 🚀 API设计

### 基础信息
- **Base URL**: `https://api.yansu.io/v1`
- **认证方式**: API Key (Bearer Token)
- **数据格式**: JSON

### 1. 创建录制会话
```http
POST /recording/sessions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "user_id": "user_123",
  "workflow_name": "Daily Report Automation",
  "tags": ["excel", "report"]
}

Response (200):
{
  "session_id": "ses_abc123xyz",
  "status": "ready_for_recording",
  "recording_url": "https://api.yansu.io/v1/recording/ses_abc123xyz/stream",
  "expires_at": "2026-05-27T13:51:30Z"
}
```

### 2. 上传录制数据
```http
POST /recording/sessions/:session_id/actions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "actions": [
    {
      "type": "click",
      "target": "#submit-btn",
      "timestamp": 1716731490123,
      "screenshot": "base64_encoded_image"
    },
    {
      "type": "input",
      "target": "#username",
      "value": "test@example.com",
      "timestamp": 1716731491456
    }
  ]
}

Response (200):
{
  "received": 2,
  "total_actions": 25,
  "status": "recording"
}
```

### 3. 结束录制并生成代码
```http
POST /recording/sessions/:session_id/complete
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "language": "javascript", // javascript, python
  "framework": "playwright" // playwright, puppeteer, selenium
}

Response (200):
{
  "status": "generating",
  "estimated_seconds": 15,
  "status_url": "https://api.yansu.io/v1/recording/ses_abc123xyz/status"
}
```

### 4. 轮询生成状态
```http
GET /recording/sessions/:session_id/status
Authorization: Bearer YOUR_API_KEY

Response (200):
{
  "status": "completed", // queued, processing, completed, failed
  "result": {
    "code": "const { chromium } = require('playwright');\n\nasync function automate() {\n  const browser = await chromium.launch();\n  const page = await browser.newPage();\n  await page.goto('https://example.com');\n  await page.fill('#username', 'test@example.com');\n  await page.click('#submit-btn');\n  await browser.close();\n}\n\nautomate();",
    "language": "javascript",
    "framework": "playwright",
    "variables": [
      {
        "name": "USERNAME",
        "suggested_value": "test@example.com"
      }
    ],
    "quality_score": 0.87,
    "suggestions": [
      "Add error handling around page navigation",
      "Consider adding waitForLoadState for reliability"
    ]
  },
  "cost": {
    "credits_used": 1,
    "credits_remaining": 99
  }
}
```

### 5. 直接从描述生成（无录制）
```http
POST /workflows/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "description": "I want to automate logging into Gmail and downloading the latest attachment from my inbox",
  "language": "python",
  "framework": "playwright",
  "detailed": true
}

Response (200):
{
  "workflow_id": "wf_xyz789",
  "code": "...",
  "cost": {
    "credits_used": 2
  }
}
```

### 6. 查询余额
```http
GET /account/balance
Authorization: Bearer YOUR_API_KEY

Response (200):
{
  "credits_total": 100,
  "credits_used": 1,
  "credits_remaining": 99,
  "subscription_plan": "Starter Pack",
  "next_payment": null
}
```

---

## 📦 集成到您的AI工具站

### 方案1: 嵌入式iframe（最简单）
```html
<!-- 在您的网站上添加这个 -->
<div id="yansu-container"></div>

<script src="https://cdn.yansu.io/embed/v1.js"></script>
<script>
Yansu.init({
  apiKey: 'pk_live_your_key', // 您的API Key
  container: '#yansu-container',
  theme: {
    primaryColor: '#4F46E5',
    backgroundColor: '#FFFFFF'
  },
  onComplete: (result) => {
    console.log('Generated code:', result.code);
    // 将代码显示给用户或保存到数据库
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
</script>
```

### 方案2: 直接API调用（更灵活）

```javascript
// yansu-client.js
export class YansuClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.yansu.io/v1';
  }

  async generateWorkflowFromDescription(description, options = {}) {
    const response = await fetch(`${this.baseUrl}/workflows/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        language: options.language || 'javascript',
        framework: options.framework || 'playwright',
        detailed: true
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async checkBalance() {
    const response = await fetch(`${this.baseUrl}/account/balance`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    return response.json();
  }
}

// 使用示例
const yansu = new YansuClient('your_api_key');

// 在您的网站上
async function handleUserRequest() {
  const description = document.getElementById('workflow-desc').value;

  try {
    const result = await yansu.generateWorkflowFromDescription(description);

    // 显示生成的代码
    document.getElementById('code-output').textContent = result.code;

    // 显示使用的额度
    const balance = await yansu.checkBalance();
    document.getElementById('balance-display').textContent =
      `Credits Remaining: ${balance.credits_remaining}`;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### 方案3: 混合模式（推荐）
- 前端使用iframe提供录制界面
- 后端调用API存储生成的代码
- 您可以加价转售给用户（如：$99的包，您收用户$149）

---

## 🛠 技术架构

### 后端技术栈
- **框架**: FastAPI (Python) 或 NestJS (TypeScript)
- **数据库**: PostgreSQL (主数据) + Redis (缓存/队列)
- **队列**: Celery 或 BullMQ (异步处理)
- **存储**: S3 (录制数据、截图)
- **AI**: Claude 3.5 Sonnet + Playwright

### 架构图
```
用户工具站 → Yansu API Gateway
                   ↓
          ┌────────┴────────┐
          ↓                 ↓
     API Server       Worker Pool
          ↓                 ↓
     PostgreSQL         Claude API
          ↓
         Redis
          ↓
         S3
```

---

## 📊 盈利模型

### 成本结构
- **AI成本**: ~$0.05/次生成
- **基础设施**: ~$0.01/次
- **总成本**: ~$0.06/次

### 定价策略
- **Starter Pack**: $9 → 100次 → 您赚 $9 - $6 = $3
- **Basic Pack**: $29 → 500次 → 您赚 $29 - $30 = -$1? 不，调整为500次 $49
- **更正方案**:
  - $9 → 50次 ($0.18/次)
  - $29 → 200次 ($0.145/次)
  - $99 → 1,000次 ($0.099/次)
  - $299 → 5,000次 ($0.0598/次)

### 盈亏平衡
- 月销售100个Basic Pack: $2,900收入
- 成本: 100×200×$0.06 = $1,200
- 利润: $1,700/月

---

## 🚀 MVP发布路线

### Week 1-2: 核心API
- [ ] 基础认证系统
- [ ] 描述生成代码API
- [ ] 额度计费系统
- [ ] 简单的Web界面

### Week 3-4: 录制功能
- [ ] 浏览器扩展录制器
- [ ] 录制数据处理
- [ ] 模式识别算法
- [ ] 代码生成优化

### Week 5-6: 集成文档
- [ ] 完整API文档
- [ ] SDK (JavaScript, Python)
- [ ] 嵌入组件
- [ ] 合作伙伴计划

---

## 🔑 成功关键

1. **先从简单做起**: 先上线"描述生成代码"功能，录制功能可以后续添加
2. **价格透明**: 海外用户喜欢明确的按次付费，不喜欢订阅锁定
3. **API文档要好**: 开发者只看文档就会用
4. **快速响应**: API响应时间 < 30秒

需要我帮您开始实现这个API吗？
