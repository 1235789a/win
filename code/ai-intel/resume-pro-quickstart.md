# ResumePro 快速启动指南

## 环境准备

### 1. 安装Node.js (v18+)
```bash
# 检查版本
node -v
# 如果低于18，先升级
nvm install 18
nvm use 18
```

### 2. 安装pnpm（推荐）
```bash
npm install -g pnpm
```

### 3. 克隆开源模块

```bash
# 创建项目目录
mkdir resume-pro
cd resume-pro

# 克隆核心模块
git clone https://github.com/amruthpillai/reactive-resume.git
git clone https://github.com/srbhr/Resume-Matcher.git

# 进入reactive-resume（主项目）
cd reactive-resume
```

## 部署 reactive-resume

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# 数据库（使用SQLite简化部署）
DATABASE_URL="file:./dev.db"

# OpenAI API（简历生成用）
OPENAI_API_KEY="sk-xxx"
OPENAI_BASE_URL="https://api.deepseek.com/v1"
OPENAI_MODEL="deepseek-chat"

# Claude API（ATS分析用）
ANTHROPIC_API_KEY="sk-ant-xxx"

# Stripe支付
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# NextAuth（可选）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 查看效果。

## 集成 Resume-Matcher ATS功能

### 1. 安装Python依赖（用于ATS分析）

```bash
# 创建Python虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安装依赖
pip install sentence-transformers scikit-learn numpy pandas
```

### 2. 部署ATS模型

创建 `app/api/ats-analysis/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();
    
    // 调用Python ATS分析脚本
    const result = execSync(
      `source venv/bin/activate && python ats_analysis.py "${resumeText}" "${jobDescription}"`,
      { encoding: 'utf-8' }
    );
    
    const analysis = JSON.parse(result);
    
    return NextResponse.json({
      success: true,
      atsScore: analysis.ats_score,
      keywords: analysis.matched_keywords,
      missingKeywords: analysis.missing_keywords,
      suggestions: analysis.suggestions
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'ATS analysis failed'
    }, { status: 500 });
  }
}
```

### 3. 创建ATS分析脚本

创建 `ats_analysis.py`：

```python
#!/usr/bin/env python3
import sys
import json
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def calculate_ats_score(resume_text: str, job_description: str) -> dict:
    """计算简历ATS匹配度"""
    
    # 加载预训练模型
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # 提取关键词
    jd_keywords = extract_keywords(job_description)
    resume_keywords = extract_keywords(resume_text)
    
    # 计算匹配度
    matched = set(jd_keywords) & set(resume_keywords)
    missing = set(jd_keywords) - set(resume_keywords)
    
    # 计算分数
    ats_score = (len(matched) / len(jd_keywords)) * 100 if jd_keywords else 0
    
    return {
        'ats_score': round(ats_score, 2),
        'matched_keywords': list(matched),
        'missing_keywords': list(missing),
        'suggestions': generate_suggestions(missing)
    }

def extract_keywords(text: str) -> list:
    """简单的关键词提取"""
    # 实际项目中应该使用更复杂的NLP处理
    words = text.lower().split()
    # 过滤停用词
    stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
    return [w for w in words if len(w) > 3 and w not in stopwords]

def generate_suggestions(missing_keywords: set) -> list:
    """生成优化建议"""
    suggestions = []
    for keyword in list(missing_keywords)[:5]:
        suggestions.append(f"建议在简历中添加: {keyword}")
    return suggestions

if __name__ == '__main__':
    resume = sys.argv[1] if len(sys.argv) > 1 else ''
    jd = sys.argv[2] if len(sys.argv) > 2 else ''
    
    result = calculate_ats_score(resume, jd)
    print(json.dumps(result, ensure_ascii=False))
```

## 配置Stripe支付

### 1. 创建Stripe账户

访问 https://stripe.com 注册开发者账户。

### 2. 安装Stripe SDK

```bash
pnpm add @stripe/stripe-js stripe
```

### 3. 创建支付API

创建 `app/api/create-payment/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { productType, amount } = await request.json();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // 转换为分
      currency: 'usd',
      metadata: {
        productType
      }
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment creation failed' },
      { status: 500 }
    );
  }
}
```

### 4. 前端支付组件

创建 `components/PaymentButton.tsx`：

```tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

function PaymentForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });
    
    if (!error) {
      onSuccess();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        支付 {amount} USDT
      </button>
    </form>
  );
}

export default function PaymentButton({ amount, productType }: { amount: number; productType: string }) {
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType, amount })
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret));
  }, [amount, productType]);
  
  if (!clientSecret) return <div>加载中...</div>;
  
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm amount={amount} onSuccess={() => alert('支付成功！')} />
    </Elements>
  );
}
```

## 添加简历模板

### 1. 克隆模板项目

```bash
cd ..
git clone https://github.com/posquit0/Awesome-CV.git templates/awesome-cv
git clone https://github.com/geekcompany/ResumeSample.git templates/resume-sample
```

### 2. 创建模板组件

创建 `components/ResumeTemplates.tsx`：

```tsx
import React from 'react';

export const templates = [
  {
    id: 'modern',
    name: '现代简约',
    description: '适合技术岗位',
    component: ModernTemplate
  },
  {
    id: 'classic',
    name: '经典正式',
    description: '适合管理岗位',
    component: ClassicTemplate
  },
  {
    id: 'creative',
    name: '创意设计',
    description: '适合设计岗位',
    component: CreativeTemplate
  }
];

function ModernTemplate({ data }) {
  return (
    <div className="font-sans p-8">
      <header className="border-b-2 border-blue-600 pb-4 mb-4">
        <h1 className="text-3xl font-bold">{data.name}</h1>
        <p className="text-gray-600">{data.title}</p>
        <div className="flex gap-4 mt-2 text-sm">
          <span>{data.email}</span>
          <span>{data.phone}</span>
          <span>{data.location}</span>
        </div>
      </header>
      
      <section className="mb-4">
        <h2 className="text-xl font-semibold text-blue-600 mb-2">工作经历</h2>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between">
              <h3 className="font-semibold">{exp.company}</h3>
              <span className="text-gray-500">{exp.period}</span>
            </div>
            <p className="text-gray-700">{exp.description}</p>
          </div>
        ))}
      </section>
      
      <section>
        <h2 className="text-xl font-semibold text-blue-600 mb-2">技能</h2>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill, i) => (
            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

// 导出其他模板...
```

## 部署到Vercel

### 1. 安装Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录并部署

```bash
vercel login
vercel --prod
```

### 3. 配置环境变量

在 Vercel Dashboard 中配置：
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 快速测试

### 1. 启动本地服务器

```bash
pnpm dev
```

### 2. 测试流程

1. 访问 http://localhost:3000
2. 选择"AI简历生成"
3. 填写基本信息
4. 选择模板
5. 点击支付
6. 查看生成的简历

### 3. 测试ATS功能

1. 上传简历
2. 粘贴目标JD
3. 点击"分析"
4. 查看ATS分数和优化建议

## 常见问题

### Q: 如何获取OpenAI API Key?
A: 访问 https://platform.openai.com/api-keys

### Q: 如何获取Stripe API Key?
A: 访问 https://dashboard.stripe.com/apikeys

### Q: Python依赖安装失败?
A: 确保Python版本>=3.8，并使用国内镜像：
```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple sentence-transformers
```

### Q: 部署到Vercel后样式不对?
A: 检查tailwind配置，确保content路径正确：
```js
// tailwind.config.js
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
]
```

---

**下一步**：完成上述步骤后，你就有了一个可以正常运行的简历优化服务。接下来：
1. 购买域名并配置SSL
2. 申请Stripe商业账户（支持真实支付）
3. 在小红书/知乎发布内容引流
4. 持续优化产品
