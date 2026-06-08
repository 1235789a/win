# CryptoIntel 安装指南

## 📋 前置要求

- Python 3.8+
- Node.js 18+
- npm 或 yarn

## 🚀 安装步骤

### 方式一：一键安装（推荐）

```bash
# 克隆项目
git clone https://github.com/your-username/CryptoIntel.git
cd CryptoIntel

# 运行一键安装脚本
chmod +x scripts/install-all.sh
./scripts/install-all.sh
```

### 方式二：手动安装

#### 1. 安装爬虫层

```bash
cd scraper

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 运行安装脚本
chmod +x install.sh
./install.sh
```

#### 2. 安装分析层

```bash
cd ../analyzer

# 安装依赖
npm install
```

## 🔑 配置认证

### Twitter/X 认证

1. 在浏览器登录 x.com
2. 打开开发者工具 (F12)
3. 转到 Application → Cookies → x.com
4. 复制 `auth_token` 和 `ct0` 的值

```bash
export TWITTER_AUTH_TOKEN="your_auth_token_value"
export TWITTER_CT0="your_ct0_value"
```

### Reddit 认证

1. 确保已在浏览器登录 reddit.com
2. 运行：

```bash
rdt login
```

### AI API 配置

复制环境变量模板并编辑：

```bash
cp .env.example .env
nano .env
```

填入你的 API 密钥：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 🧪 测试安装

### 测试爬虫

```bash
cd scraper
source venv/bin/activate
python3 -m collectors.crypto_collector --limit 10
```

### 测试分析

```bash
cd ../analyzer
npm run analyze -- --input ../data/raw.json --output ../data/analyzed.json
```

## 📦 目录结构

安装后，项目结构如下：

```
CryptoIntel/
├── venv/                    # Python 虚拟环境
├── scraper/                 # 爬虫层
│   ├── agent_reach/         # Agent-Reach 源码
│   ├── collectors/          # 收集器
│   └── venv/                # 爬虫虚拟环境
├── analyzer/                # 分析层
│   ├── src/                 # 源代码
│   ├── scripts/             # 脚本
│   └── data/                # 数据库
├── shared/                  # 共享模块
├── data/                    # 数据目录
└── docs/                    # 文档
```

## ❓ 常见问题

### Q: 安装失败怎么办？

A: 检查以下内容：
1. Python 版本是否 ≥ 3.8
2. Node.js 版本是否 ≥ 18
3. 网络连接是否正常
4. 权限是否足够

### Q: Twitter/Reddit 认证失败？

A:
1. 确保已在浏览器登录
2. 检查 Cookie 是否过期
3. 重新获取 Cookie 值
4. 更新环境变量

### Q: AI API 调用失败？

A:
1. 检查 API Key 是否正确
2. 检查 API 额度是否充足
3. 确认网络连接正常
4. 查看日志错误信息

## ✅ 验证安装

运行以下命令验证安装是否成功：

```bash
# 1. 检查 Python 工具
which twitter  # 应该显示路径
which rdt     # 应该显示路径

# 2. 检查 Node.js
which node    # 应该显示版本

# 3. 运行测试收集
cd scraper
source venv/bin/activate
python3 -m collectors.crypto_collector --limit 5
```

---

## 🎉 安装完成！

安装成功后，你可以：

1. [使用指南](usage.md) - 学习如何使用系统
2. [API参考](api-reference.md) - 了解 API 接口
3. [示例](../README.md#示例) - 查看使用示例