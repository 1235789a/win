# 02 · 功能清单

> 🟢 = 已实现并验证过
> 🟡 = 有代码但没接上新 prompt / 没测过
> ⚪ = 未实现，见 ROADMAP

---

## 核心管线（必用）

| 功能 | 状态 | 入口 | 说明 |
|---|---|---|---|
| 粘贴文本分析 | 🟢 | `/analyze` 页 → POST /api/analyze | 最常用路径 |
| 从 URL 抓取 + 分析 | 🟢 | `/analyze` 页填 url | Reddit JSON / HN API / PH oEmbed / 通用 readability |
| 只抓不分析（调试） | 🟢 | POST /api/fetch-url | 用于调试抓取器 |
| 自动清洗文本 | 🟢 | `src/lib/cleaner.ts` | 去广告、去 markdown 垃圾 |
| Self-consistency N 次 | 🟢 | body.n = 1-5 | 取中位数分 |
| 落库 | 🟢 | `insertOpportunity()` | SQLite WAL 模式 |
| 成本统计 | 🟢 | 每条 opportunity 含 tokens_in/out/cost_usd | |

---

## AI 层（@mi/ai-core）

| 功能 | 状态 | 说明 |
|---|---|---|
| Gemini OpenAI-compat | 🟢 | 默认路径 |
| Anthropic Claude | 🟢 | 改 env 一秒切换 |
| 大陆代理自动穿透 | 🟢 | 读 `HTTPS_PROXY` 注入 undici |
| 429 / 500 / 503 重试 | 🟢 | 指数退避 4 次 |
| Gemini 2.5 thinking 自动关 | 🟢 | `reasoning_effort:"none"` |
| Gemini JSON 补丁 | 🟢 | 自动加 "output ONLY JSON" 系统指令 |
| 自动抽 JSON | 🟢 | `extractJSON()` 处理围栏 / 裸对象 / 嵌套 sql 围栏 |
| Token 成本计算 | 🟢 | 内置价格表 + 未知模型兜底 |

---

## Dashboard（前端）

| 功能 | 状态 | 说明 |
|---|---|---|
| 首页统计 | 🟢 | 机会总数 / 平均分 / 今日成本 |
| 机会列表 | 🟢 | `/opportunities`，按分数降序 |
| 卡片展开看蓝图 | 🟢 | `opportunity-card.tsx` 点击展开 |
| 筛选 / 排序 | 🟡 | API 支持 `?min_score=&platform=`，前端 UI 未做 |
| 机会详情独立页 | ⚪ | 目前只在列表里展开，没有 `/opportunities/[id]` |
| 收藏 | 🟡 | DB 有 `favorite` 列，UI 没做 |
| 标签分类页 | ⚪ | tags 存了但没单独入口 |
| 深色 / 浅色切换 | ⚪ | 默认暗，未做主题切换 |

---

## 数据输入

| 功能 | 状态 | 说明 |
|---|---|---|
| 手动粘贴 | 🟢 | |
| 单 URL 抓取 | 🟢 | 支持 Reddit / HN / PH / 通用 |
| Reddit API 批量 | 🟡 | `scripts/cheap_harvester.ts` 是老版，待重构 |
| Twitter/X 导入 | ⚪ | 接口有成本，待定 |
| RSS | ⚪ | |
| 定时抓取 | ⚪ | 无 scheduler |

---

## AI 产品建议模块（原始需求 #4）

| 功能 | 状态 | 说明 |
|---|---|---|
| 工具 / SaaS / Agent / Workflow 自动分类 | 🟢 | v4 prompt 在 blueprint 第 1-2 节已含 |
| 为每条痛点生成多个产品创意 | 🟡 | 目前只生成 1 个（最匹配的那个），下一版可列 3 个变体 |

---

## 运维 / 本地启动

| 功能 | 状态 | 说明 |
|---|---|---|
| `npm run dev` | 🟢 | |
| `start.bat` | 🟢 | 代理探测 + dev + 开浏览器 |
| `stop.bat` | 🟢 | 关 port 3000 进程 |
| `install-shortcut.bat` | 🟢 | 桌面快捷方式 |
| `scripts/test-one.mjs` | 🟢 | Upwork 痛点冒烟测（35s 左右） |
| `scripts/probe-proxy.mjs` | 🟢 | 代理连通性 |
| `scripts/probe-long.mjs` | 🟢 | 验证 thinking 关没关 |

---

## 未实现的大模块（详见 06-ROADMAP）

- ⚪ 定时 harvester（多平台抓取）
- ⚪ 重复痛点聚类（同一个坑被多个帖子提到 → 高频信号）
- ⚪ 每日日报（Top 3 今日新机会邮件 / TG 推送）
- ⚪ 多 Agent 协作（初筛 agent + 深度 agent + 对抗 agent）
- ⚪ 自动生成落地页（用 blueprint 直接 vibe-code 一个 Landing）
- ⚪ 自动生成 SEO 内容 / 社媒帖子
- ⚪ 订阅收费 / 支付
- ⚪ 团队协作 / 权限
