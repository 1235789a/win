# Yansu API - 工作流自动化服务

## 任务背景

我刚刚从一个AI创业机会挖掘系统中发现了这个高价值机会。原始数据来自真实的互联网信号（Hacker News、Product Hunt、GitHub等），系统挖掘出了29个P0级（最高价值）机会，其中"Yansu - 工作流自动化"是最有商业前景的一个。

**原始数据来源：** `/workspace/code/ai-intel/data/` 和 `/workspace/code/ai-intel/yansu-api/`

---

## 为什么这个项目能变现？

### 1️⃣ 市场验证过的真实痛点

根据数据挖掘结果：
- **Product Hunt上类似工具多次上榜**：说明市场需求强烈
- **Hacker News讨论热烈**：开发者社区关注度高
- **GitHub趋势显示**：AI+自动化是当前热点

### 2️⃣ 清晰的变现路径

| 方面 | 说明 |
|------|------|
| **定价策略** | 按次付费（Credits），用户讨厌订阅，喜欢一次性购买 |
| **利润率** | ~70% - AI成本$0.06/次，售价$0.18-$0.20/次 |
| **目标用户** | 开发者、QA、创业公司、产品经理 - 支付能力强 |
| **可扩展性** | Build Once, Sell Infinite - 一次开发，无限售卖 |

### 3️⃣ 商业测算

- **保守估计**：100个付费用户/月，平均$50/人 → **$5,000/月收入**
- **中等估计**：500个付费用户/月 → **$25,000/月收入**
- **乐观估计**：2,000个付费用户/月 → **$100,000/月收入**

### 4️⃣ 为什么现在是时机？

1. **AI技术成熟**：GPT-4/DeepSeek可以生成高质量代码
2. **开发者疲劳**：重复工作太多，大家都想自动化
3. **无订阅趋势**：用户越来越不喜欢订阅制
4. **API经济繁荣**：开发者习惯购买API服务

---

## 您的任务

帮我构建完整的 **Yansu API** 服务，包括后端API、支付系统、前端嵌入组件。

**核心概念：** 用户输入自然语言描述 → AI生成可直接运行的自动化代码（Playwright/Puppeteer）

**参考文件位置：** `/workspace/code/ai-intel/yansu-api/`

**必读文件：**
- `README.md` - 完整项目设计文档
- `package.json` - 依赖配置
- `.env.example` - 环境变量
- `src/index.ts` - API入口
- `src/routes/workflows.ts` - 工作流生成
- `src/routes/payments.ts` - 支付
- `src/services/workflowGenerator.ts` - AI生成逻辑
- `embed/yansu-widget.html` - 可嵌入组件示例

---

## 技术要求

### 后端（Node.js + TypeScript）

- **框架**：Express.js（已有基础）
- **数据库**：先用SQLite快速开发，之后可选PostgreSQL
- **ORM**：Prisma或Drizzle（推荐Prisma）
- **AI API**：DeepSeek（便宜！兼容OpenAI格式）
- **支付**：Stripe
- **认证**：API Key（Bearer Token）

### 前端

- **嵌入组件**：原生JS + Web Components（易于集成）
- **可选**：React/Vue组件版本
- **设计风格**：简洁、现代、开发者友好

---

## 定价表（不要订阅制！）

| 方案 | 价格 | Credits | 每Credits成本 |
|------|------|---------|---------------|
| Starter | $9 | 50 | $0.18 |
| Basic | $29 | 200 | $0.145 |
| Pro | $99 | 1,000 | $0.099 |
| Enterprise | $299 | 5,000 | $0.0598 |

**重要：** 1 Credit = 1次API调用（生成1个工作流）

---

## API Endpoints

### 1. Workflow Generation

```
POST /v1/workflows/generate
Body: { description, language, framework, detailed }
Response: { workflow_id, status, estimated_seconds, status_url }

GET /v1/workflows/:id/status
Response: { status, result, error, cost }
```

### 2. Account

```
GET /v1/account/balance
Response: { credits_total, credits_used, credits_remaining }

GET /v1/account/api-keys
POST /v1/account/api-keys
```

### 3. Payments

```
GET /v1/payments/packages
Response: { packages: [...] }

POST /v1/payments/create-checkout-session
Body: { package, success_url, cancel_url }
Response: { session_id, url }

POST /v1/payments/webhook (Stripe)
```

---

## 实现步骤

### Phase 1: 核心API（2-3天）

- [ ] 设置项目、环境变量
- [ ] 实现数据库模型（User, ApiKey, Credit, Workflow）
- [ ] 实现AI代码生成（DeepSeek API）
- [ ] 实现认证中间件
- [ ] 测试workflow生成功能

### Phase 2: 支付系统（1-2天）

- [ ] Stripe配置
- [ ] Checkout Session创建
- [ ] Webhook处理 + 充值逻辑
- [ ] 测试支付流程

### Phase 3: 前端组件（1-2天）

- [ ] 完善嵌入widget
- [ ] CDN打包版本
- [ ] 开发者文档

### Phase 4: 文档和测试（1天）

- [ ] API文档（Swagger/OpenAPI）
- [ ] 集成示例
- [ ] 完整测试

---

## UI/UX要求

### Widget（嵌入组件）

- **简洁、现代**
- **3个主要部分：**
  1. 输入区域（描述、语言选择）
  2. 生成按钮 + Loading状态
  3. 结果显示（代码 + Copy按钮 + 建议）

### 颜色方案

- 主色：`#4f46e5`（紫色，开发者喜欢）
- 背景：`#f8fafc`（浅灰）
- 深色代码区：`#1e293b`

---

## 关键提示

### 1. 成本控制最重要！

- 使用 **DeepSeek API**，不是OpenAI GPT-4
- DeepSeek价格是GPT-4的 1/20 - 1/50！
- API兼容，直接换base_url即可

### 2. 先做MVP，再完善

- 先用SQLite，不用搞复杂的PostgreSQL
- 先实现"描述生成代码"，录制功能可以后加
- 前端先做简单的HTML widget，再搞React

### 3. 开发者体验是关键

- API文档要非常清晰
- 错误信息要有用
- 提供完整的示例代码
- 让用户3分钟内能跑通第一个demo

---

## 数据库Schema（Prisma示例）

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  apiKeys     ApiKey[]
  creditLogs  CreditLog[]
  workflows   Workflow[]

  creditsTotal    Int @default(0)
  creditsUsed     Int @default(0)
  creditsRemaining Int @default(0)
}

model ApiKey {
  id        String   @id @default(cuid())
  userId    String
  name      String
  key       String   @unique
  createdAt DateTime @default(now())
  lastUsed  DateTime?

  user User @relation(fields: [userId], references: [id])
}

model CreditLog {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "purchase", "usage", "refund"
  amount      Int
  description String
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model Workflow {
  id          String   @id @default(cuid())
  userId      String
  description String
  language    String   // "javascript", "python"
  framework   String   // "playwright", "puppeteer"
  code        String?
  status      String   // "queued", "processing", "completed", "failed"
  error       String?
  creditsUsed Int      @default(1)
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

## 验收标准

### 必须完成

- [ ] 用户可以注册，获取API Key
- [ ] 用户可以购买Credits（Stripe Checkout）
- [ ] 用户可以调用API生成代码
- [ ] 可以通过Widget嵌入到其他网站
- [ ] 有完整的API文档

### 质量要求

- [ ] 代码结构清晰，易于维护
- [ ] 有适当的错误处理
- [ ] 有Rate Limiting防滥用
- [ ] 有日志记录
- [ ] 有测试（至少核心功能）

---

## 成功指标

### 短期（上线1个月）

- 100个注册用户
- 20个付费用户
- $500+收入

### 中期（上线3个月）

- 500个注册用户
- 100个付费用户
- $5,000+月收入

### 长期（上线1年）

- 5,000+注册用户
- 1,000+付费用户
- $50,000+月收入

---

## 参考文件

所有相关文件位于：`/workspace/code/ai-intel/yansu-api/`

---

**祝开发顺利！这个项目很有前途！** 🎉
