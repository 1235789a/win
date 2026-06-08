# 🚀 CryptoIntel 快速启动指南

## 📍 当前状态

✅ **已完成**:
- 项目架构设计
- 爬虫层代码（基于 Agent-Reach）
- 分析层代码（四维分析）
- 安装脚本
- 文档

❌ **待执行**（需要本地环境）:
- 安装依赖
- 配置认证
- 运行爬虫
- 获取真实数据

---

## 🎯 下一步：本地运行

### 步骤 1: 下载项目

```bash
# 在你的本地电脑
cd ~/projects  # 或任何你喜欢的目录

# 方式1: 如果有 Git
git clone https://github.com/your-username/CryptoIntel.git

# 方式2: 直接复制
scp -r user@server:/workspace/CryptoIntel .
```

### 步骤 2: 一键安装

```bash
cd CryptoIntel
chmod +x scripts/install-all.sh
./scripts/install-all.sh
```

### 步骤 3: 配置认证

#### Twitter/X 认证

1. 打开浏览器，登录 https://x.com
2. 按 F12 打开开发者工具
3. 转到 Application → Cookies → x.com
4. 复制 `auth_token` 和 `ct0` 的值

```bash
export TWITTER_AUTH_TOKEN="你复制的auth_token值"
export TWITTER_CT0="你复制的ct0值"
```

#### Reddit 认证

```bash
# 确保浏览器已登录 reddit.com
rdt login
```

#### AI API 认证

```bash
cp .env.example .env
nano .env
```

填入你的 OpenAI API Key：
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步骤 4: 测试运行

```bash
# 激活环境
cd CryptoIntel/scraper
source venv/bin/activate

# 测试爬虫
python3 -m collectors.crypto_collector --limit 10

# 如果成功，应该看到类似输出：
# 🐦 收集 Twitter 数据...
# ✅ 获取 10 条 Twitter 数据
```

### 步骤 5: 收集数据

```bash
# 收集100条数据
python3 -m collectors.crypto_collector --limit 100 --output ../data/raw.json

# 数据会保存到 data/raw.json
```

### 步骤 6: 分析数据

```bash
# 新开终端
cd CryptoIntel/analyzer

# 运行分析
npm run analyze -- --input ../data/raw.json

# 分析完成后查看结果
npm run list -- --min-score 60
```

---

## 📊 预期输出

### 类型统计 (Type Count)

```
============================================================
AMA: 13
Airdrop: 17
Partnership: 18
Listing: 18
Giveaway: 20
Meme: 14
============================================================
Total: 100
```

### 极品机会 (P0 ≥75分)

```
============================================================
#1 Bitcoin Airdrop Tracker
   分数: 78/100
   维度: Pain(22) Traffic(18) SEO(16) USDT(8) Comp(10) Speed(4)
   优先级: P0
============================================================
```

---

## 🔧 常见问题

### Q: Twitter 认证失败？

**A:** 确保：
1. 浏览器已登录 x.com
2. Cookie 没有过期
3. auth_token 和 ct0 都复制了

### Q: rdt login 失败？

**A:** 
1. 确保浏览器已登录 reddit.com
2. 尝试用 Cookie-Editor 扩展手动导出

### Q: npm install 失败？

**A:**
```bash
# 清理缓存重试
rm -rf node_modules package-lock.json
npm install
```

### Q: Python 虚拟环境问题？

**A:**
```bash
cd scraper
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🎓 后续学习

安装成功后，你可以：

1. **调整收集参数**
   ```bash
   python3 -m collectors.crypto_collector --limit 500
   ```

2. **查看 Web 界面**
   ```bash
   cd analyzer
   npm run dev
   # 访问 http://localhost:3000
   ```

3. **自定义平台**
   - 编辑 `scraper/collectors/crypto_collector.py`
   - 添加新的 Twitter 账号或 Reddit 版块

4. **调整评分权重**
   - 编辑 `analyzer/src/lib/final-score.ts`

---

## 📞 需要帮助？

- 查看详细文档: `docs/`
- 查看架构设计: `ARCHITECTURE.md`
- 查看 README: `README.md`

---

## ✅ 检查清单

在开始之前，确保你已经有：

- [ ] Python 3.8+
- [ ] Node.js 18+
- [ ] Twitter/X 账号
- [ ] Reddit 账号
- [ ] OpenAI API Key（或 Anthropic Key）

准备好后，开始运行！🚀