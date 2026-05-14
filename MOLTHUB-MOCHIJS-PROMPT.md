# Cline Prompt：MochiJS 浏览器指纹规避库（Molt Hub Store 产品 #1）

## 你的角色
你是一个全栈独立开发者，正在为 molthub.click（一个卖自动化脚本/工具的暗色系技术商店）开发第一个付费产品。

## 产品背景

### 痛点（来自真实 HN/Reddit 信号，score 95/100）
现有的浏览器自动化工具（Selenium/Puppeteer/Playwright）在面对 Cloudflare、DataDome、PerimeterX 等 WAF 和反机器人检测时**几乎无法通过**。原因是：
- 它们默认暴露大量自动化特征（`navigator.webdriver=true`、缺失插件、Canvas hash 异常）
- 现有的"反检测"方案（如 undetected-chromedriver）是打补丁模式，每次 Chromium 升级就废掉
- 商业反检测浏览器（Multilogin/GoLogin）$100+/月，且用户无法控制底层逻辑
- **真正有效的 WAF 绕过需要理解 WAF 看什么**，而不是盲目改探针值

### 市场验证
- HN "Show HN: Mochi.js" 帖获得大量讨论（FingerprintJS Suspect Score 降到 5）
- Upwork 上 "web scraping bot" / "bypass cloudflare" 关键词长期有悬赏
- 目标用户：数据采集公司、SEO 工具商、价格监控服务、电商竞品分析

### Molt Hub 商业模型
- **定价**：$49 一次性（基础版 5 个 fingerprint profile）/ $19/月订阅（无限 profile + 自动更新）
- **交付**：Lemon Squeezy 付款 → Webhook 触发 → 自动下发 License Key → 用户通过 API 鉴权网关校验
- **Store 页面**：molthub.click/store/mochijs
- **Log 内容**：molthub.click/log/waf-detection-deep-dive（逆向分析文章建立 B 端信任）

---

## 技术规范

### 项目名称
`mochi-stealth` (npm 包名: `@molthub/mochi-stealth`)

### 技术栈
- **运行时**：Bun（首选）/ Node.js 18+（兼容）
- **浏览器引擎**：Playwright（不是 Puppeteer，Playwright 对 Firefox/WebKit 支持更好）
- **语言**：TypeScript (strict mode)
- **部署**：用户本地安装 npm 包 + 远程 License 校验
- **鉴权**：启动时调 `https://api.molthub.click/v1/license/verify` 校验 key

### 核心架构

```
@molthub/mochi-stealth/
├── src/
│   ├── index.ts              # 主入口 export { launch, createProfile }
│   ├── fingerprint/
│   │   ├── canvas.ts         # Canvas 指纹噪声注入
│   │   ├── webgl.ts          # WebGL vendor/renderer 伪装
│   │   ├── webrtc.ts         # WebRTC local IP 泄漏防护
│   │   ├── navigator.ts      # navigator 属性全量覆写
│   │   ├── audio.ts          # AudioContext 指纹扰动
│   │   ├── fonts.ts          # 字体枚举伪装
│   │   └── timezone.ts       # 时区/语言一致性
│   ├── evasion/
│   │   ├── cloudflare.ts     # Turnstile / JS Challenge 自动解
│   │   ├── datadome.ts       # DataDome 信号欺骗
│   │   ├── perimeter-x.ts    # PerimeterX sensor 注入拦截
│   │   └── generic-waf.ts    # 通用 WAF 检测规避
│   ├── behavior/
│   │   ├── mouse.ts          # 贝塞尔曲线鼠标轨迹
│   │   ├── scroll.ts         # 自然滚动模拟
│   │   ├── typing.ts         # 变速打字
│   │   └── timing.ts         # 请求间隔随机化
│   ├── profile/
│   │   ├── generator.ts      # 基于真实统计数据的 profile 生成
│   │   ├── storage.ts        # profile 持久化（JSON/加密）
│   │   └── presets.ts        # 5 个预设 profile（Win/Mac/Linux/Mobile/Tablet）
│   ├── license/
│   │   ├── verify.ts         # 远程 key 校验（带离线缓存 24h）
│   │   └── telemetry.ts      # 匿名使用统计（可关闭）
│   └── utils/
│       ├── inject.ts         # page.addInitScript 注入器
│       └── detect-test.ts    # 自检：跑一遍 FingerprintJS + CreepJS 打分
├── profiles/                 # 预生成的 5 个默认 profile JSON
├── tests/
│   ├── cloudflare.test.ts
│   ├── fingerprint-score.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 用户 API 设计（最终面向用户的接口）

```typescript
import { launch, createProfile } from '@molthub/mochi-stealth';

// 1. 创建/加载 fingerprint profile
const profile = await createProfile({
  os: 'windows',           // 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  browser: 'chrome',       // 'chrome' | 'firefox' | 'safari'
  locale: 'en-US',
  timezone: 'America/New_York',
  screen: { width: 1920, height: 1080 },
  // 可选：指定代理
  proxy: 'http://user:pass@proxy.example.com:8080',
});

// 2. 启动隐身浏览器
const browser = await launch(profile, {
  licenseKey: 'mh_live_xxxxxxxxxxxx',  // Molt Hub license key
  headless: true,
  // Playwright options passthrough
});

// 3. 正常使用 Playwright API
const page = await browser.newPage();
await page.goto('https://nowsecure.nl');  // 反检测测试站

// 4. 自检分数
const score = await page.evaluate(() => {
  // 内置的 FingerprintJS 检测
  return (window as any).__MOCHI_SCORE__;
});
console.log('Stealth score:', score); // 目标：< 10

await browser.close();
```

### 核心技术点（必须实现）

1. **指纹层**
   - `navigator.webdriver` 删除（不是设 false，是 delete）
   - `chrome.runtime` 存在性伪装
   - Canvas 2D 像素级噪声（每次不同但同 profile 一致）
   - WebGL `UNMASKED_VENDOR_WEBGL` / `UNMASKED_RENDERER_WEBGL` 匹配真实显卡
   - WebRTC `RTCPeerConnection` hook，阻止 local IP 泄漏
   - `AudioContext.createOscillator` 输出加微噪
   - 字体枚举限制（只暴露 OS 默认字体集）

2. **行为层**
   - 鼠标移动用贝塞尔曲线（不是直线 moveTo）
   - 点击前有 50-200ms 的 hover
   - 页面加载后 1-3s 才开始交互（模拟人类反应）
   - 滚动速度变化（加速→匀速→减速）

3. **WAF 规避层**
   - Cloudflare Turnstile：拦截 challenge iframe，注入解题逻辑
   - 通用 JS Challenge：检测 `__cf_bm` cookie 生成时机，自动等待
   - DataDome：hook `XMLHttpRequest` 和 `fetch`，修改 sensor data payload

4. **License 鉴权**
   - 启动时 POST `https://api.molthub.click/v1/license/verify`
   - Body: `{ key: "mh_live_xxx", machine_id: "sha256(hostname+mac)", version: "1.0.0" }`
   - 响应: `{ valid: true, plan: "pro", expires_at: "2027-01-01" }`
   - 离线缓存 24h（加密存 `~/.mochi/license.enc`）
   - 校验失败 → 限制为 demo 模式（只能跑 3 个页面）

### 优先级
1. **P0（第 1 周）**：fingerprint 全量覆写 + license 校验 + 5 个预设 profile + `launch()` API
2. **P1（第 2 周）**：Cloudflare Turnstile 自动解 + 行为模拟 + 自检评分
3. **P2（后续）**：DataDome/PerimeterX + profile 自动更新 + 使用统计 dashboard

### 验收标准
- [ ] `npx @molthub/mochi-stealth test` 跑 nowsecure.nl 和 bot.sannysoft.com，全绿
- [ ] FingerprintJS Suspect Score ≤ 10（目标 5）
- [ ] CreepJS 检测 0 个 "lies detected"
- [ ] 无有效 license 时只能跑 3 页，然后弹提示
- [ ] 5 个预设 profile 之间指纹完全不同（Canvas hash / WebGL hash / Audio hash 各异）

---

## Molt Hub 集成清单

| 元素 | 内容 |
|------|------|
| Store 卡片标题 | Mochi Stealth — Browser Fingerprint Evasion Kit |
| 卡片描述 | Playwright-based stealth automation. Pass Cloudflare, DataDome, FingerprintJS with score < 10. |
| 价格标签 | $49 / Lifetime Basic · $19/mo Pro |
| [Buy Now] | → Lemon Squeezy checkout (product_id: TBD) |
| [Live Demo] | → 跳转 nowsecure.nl 测试视频/GIF |
| [Documentation] | → /log/mochi-stealth-docs |
| Log 文章 | "逆向 Cloudflare Turnstile：从信号采集到绕过的完整链路" |
| License API | POST api.molthub.click/v1/license/verify |
| 发货 Webhook | Lemon Squeezy → 生成 `mh_live_` 前缀 key → 邮件发送 |

---

## 给 Cline 的执行指令

1. 用 `bun init` 初始化项目，TypeScript strict
2. 安装 `playwright-core`（不要 `playwright`，避免自动下载浏览器）
3. 按上面的目录结构创建所有文件
4. 先实现 `src/fingerprint/` 全部模块 → 然后 `src/license/verify.ts` → 然后 `src/index.ts`（launch + createProfile）
5. 写一个 `scripts/test-score.ts`，启动浏览器跑 `https://bot.sannysoft.com` 并截图保存
6. README.md 按 Molt Hub 风格（暗色、技术、简洁）

**不要**：
- 不要用 puppeteer-extra 或 undetected-chromedriver
- 不要 fork Chromium
- 不要做 UI/前端（这是纯 CLI/SDK 产品）
- 不要写测试用例超过 3 个（MVP 阶段）
