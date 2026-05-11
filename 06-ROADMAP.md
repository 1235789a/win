# 06 · 下一步路线

> MVP 已跑通。接下来按"先验证商业价值、再堆工程量"的顺序排。

---

## P0 · 立刻能做（建议 1-2 周内）

### 1. 机会详情独立页
现在点卡片只在列表里展开，不利于分享 / 收藏。

- 建 `app/opportunities/[id]/page.tsx`
- URL 形如 `/opportunities/7`，便于"把这条发给合伙人看"
- 右上角"导出 md / 复制 prompt / 标收藏"三个按钮
- **预计工作量**：2 小时

### 2. 标签聚类 / 高频词面板
DB 里 `tags` 字段已存。加一个 `/insights` 页：

- 显示 Top 20 标签的出现次数
- 点标签进入筛选（`?tag=Upwork`）
- **预计工作量**：3 小时
- **商业价值**：立刻看到"Upwork、Notion、Reddit 模组 等词反复出现 = 高频痛点集群"

### 3. Reddit 自动采集（轻量版）
不用完整 harvester，先做最简单的：

- 新建 `scripts/harvest-reddit.mjs`
- 读一个 hard-coded 列表：`["r/smallbusiness", "r/Upwork", "r/Entrepreneur", ...]`
- 调 `https://www.reddit.com/{sub}/hot.json?limit=50`
- 对每条帖子跑 `POST /api/analyze`（只保存 score ≥ 50 的）
- 可手动 `node scripts/harvest-reddit.mjs` 或挂 cron
- **预计工作量**：4 小时
- **商业价值**：从"每天手贴几条"变成"早晨起来看 Dashboard 有 20 条新机会"

### 4. 重复痛点去重 / 合并
同一个 Upwork 抱怨可能被 10 个帖子提到，每条都生成一份 blueprint 是浪费。

- 把 `raw_text` 做 embedding（Gemini `text-embedding-004` 免费）
- 新插入时和近 7 天的做 cosine 相似度
- 相似度 > 0.85 → 不重新生成 blueprint，只加 `reference_count +1`
- **预计工作量**：1 天
- **商业价值**：`reference_count` 本身就是"真·高频"的铁证

---

## P1 · 下个月（需要一点架构）

### 5. 多 Agent 协作管线
现在是一个 agent 做全部：打分 + 分析 + 蓝图。
可以拆成：

```
Agent A (scout)      → 只打分，快、便宜（gemini-flash-lite）
  ↓ 如果 score ≥ 70
Agent B (analyst)    → 深度痛点分析 + 用户访谈脚本
  ↓
Agent C (builder)    → 技术蓝图（用 claude-3.5-sonnet 质量最高）
  ↓
Agent D (adversary)  → "为什么这个产品会失败？" 红队挑战
  ↓
汇总成 final brief
```

优点：便宜的筛选、贵的深挖、红队防自嗨。
**预计工作量**：3-5 天。

### 6. 每日日报
- Top 3 今日新机会
- 本周高频痛点
- 本月累计成本
- 可选推送：邮件（Resend）/ Telegram Bot / Discord Webhook
- **预计工作量**：1-2 天

### 7. 自动生成 Landing Page
用某个 score ≥ 85 的 blueprint 做输入：

- AI 生成 Hero / Features / Pricing / FAQ 文案
- 产出一个独立的 Next.js / 静态 HTML 文件
- `one-command` 部署到 Vercel / Cloudflare Pages
- 挂上 Plausible 统计看点击率（= 真实市场验证）
- **预计工作量**：3-4 天
- **商业价值**：把"建议做什么"升级为"帮你做出来"，这是 $49/landing page 的起点

### 8. SEO / 社媒文案流
blueprint 第 6 节（获客）已经有 Day 1-7 日程 + 可发帖样例。
扩成：
- 生成 5 条不同角度的 Reddit 帖
- 生成 10 条 Twitter thread
- 生成 3 篇 SEO 长文（1500 词 + H2/H3 结构）
- **预计工作量**：2-3 天

---

## P2 · 商业化（有 10 个活跃机会后再想）

### 9. 订阅 / 付费
- 免费档：每月 10 次分析，不存 blueprint
- $19/月：100 次 + blueprint + 导出
- $49/月：500 次 + 自动 harvester + 日报
- 支付：先接 Stripe（海外）或 TRC20（如 landing-page 项目的做法）

### 10. 团队协作
- 机会库共享 / 评论 / 认领
- "我正在做 id=7" 锁定防重复开发

---

## 什么时候不用做的事

⚠️ 以下在 MVP 验证阶段**不要做**，做了就是过度设计：

- ❌ 复杂权限系统（RBAC / OAuth 多 provider）
- ❌ 多租户 / 工作空间
- ❌ 通知系统 / 站内信
- ❌ 国际化（i18n 已经是下个产品的事）
- ❌ 移动端 App
- ❌ 实时协作（Yjs / CRDT）
- ❌ 暗色主题切换（现在就是暗色）
- ❌ 管理后台

---

## 里程碑建议

| 时间 | 目标 | 判断是否继续做的信号 |
|---|---|---|
| 1 周 | P0 全做完 | 库里有 50 条机会 |
| 2 周 | P1 中的 5 + 6 | 每周自动产出 Top 3 可信 |
| 1 月 | P1 中的 7 | 用 1 个 blueprint 做出真实 landing，3 天内拿到 ≥ 100 UV |
| 2 月 | P2 中的 9 | 有 landing 拿到 ≥ 10 注册 = 信号够强，开始收费 |
| 3 月 | 回头看这 7 条已实现机会中 | 有 ≥ 1 条在 3 个月内赚到第一个 $100 |

如果 1 月那条做不出来（或者做出来没人注册），说明**整条情报链的产出"听起来对、做起来不对"**，要回过头改 prompt、改评分维度、改 niche 定位。
