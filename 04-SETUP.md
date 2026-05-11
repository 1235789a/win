# 04 · 从零跑起来

> 已在 Windows 11 + Node 20.x 验证。Mac / Linux 把 `.bat` 换成等价 shell 命令即可。

---

## 前置

- Node.js ≥ 20（20.10 实测 OK）
- npm ≥ 10
- 一个能访问 Google / Anthropic 的代理（大陆用户必须）
- Gemini AI Studio 免费 key（或 Anthropic key）

**申请 Gemini key**：https://aistudio.google.com/apikey
→ 点 "Get API key" → 创建 → 复制（格式 `AIzaSy...`）

---

## 三分钟启动

```powershell
# 1. 进入交付包
cd D:\handoff\ai-intel-handoff-20260511\code\ai-intel

# 2. 安装依赖（首次 2-3 分钟，会同时装 packages/ai-core）
npm install

# 3. 检查 .env.local 里的 key（打包时已带上真实 key）
notepad .env.local
#    确认 OPENAI_API_KEY 还有效，代理地址对

# 4. 启动代理（大陆）
#    Clash / V2rayN / Singbox 任意一个，确保监听 127.0.0.1:7890

# 5. 启动 dev
npm run dev
#    看到 "Ready - started server on http://localhost:3000" 即成功

# 6. 另开终端，冒烟测
node scripts/test-one.mjs
#    预期：HTTP 200 · 35s · score≈90 · blueprint 9000+ 字
```

浏览器打开 <http://localhost:3000> → 左侧 `Analyze` → 贴任意痛点 → 提交。

---

## 一键启动（可选）

```powershell
# 装桌面快捷方式
cd D:\handoff\ai-intel-handoff-20260511\code\ai-intel
.\install-shortcut.bat
```

之后双击桌面 `AI Intel` 快捷方式即可：
- 自动检测代理是否在跑
- 启动 dev 服务器
- 打开浏览器

关停：`.\stop.bat`

---

## `.env.local` 样例（默认跑 Gemini）

```bash
# ===== AI Provider =====
AI_PROVIDER=openai
OPENAI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-flash-lite

# ===== Claude (备用) =====
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# ===== 代理（大陆必填）=====
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890

# ===== 数据库 =====
DB_PATH=./data/intel.db
```

**切到 Claude：**
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
# 其它保持不动
```

---

## 恢复历史数据（可选）

交付包带了 `db-snapshot/intel.db`（7 条实测机会，含 Upwork 那条 9800 字 blueprint）。

```powershell
# 把 snapshot 拷到工作目录
Copy-Item D:\handoff\ai-intel-handoff-20260511\db-snapshot\intel.db `
          D:\handoff\ai-intel-handoff-20260511\code\ai-intel\data\intel.db
```

然后访问 <http://localhost:3000/opportunities>，应该看到 7 条记录，id=7 就是 Upwork 那条。

---

## 常用命令

| 目的 | 命令 |
|---|---|
| 跑 dev 服务器 | `npm run dev` |
| 构建 production | `npm run build` + `npm start` |
| 冒烟测（不改代码改完也跑一下）| `node scripts/test-one.mjs` |
| 把最新一条机会导出 md | `node scripts/dump-one.mjs` |
| 测代理 | `node scripts/probe-proxy.mjs` |
| 测 thinking 关没关 | `node scripts/probe-long.mjs` |
| 停掉占用 3000 端口的进程 | `.\stop.bat` |

---

## 改了 `packages/ai-core` 怎么生效

`ai-intel/package.json` 里的依赖是 `"@mi/ai-core": "file:../packages/ai-core"`，
默认情况下 Next.js 会读编译后的文件。

**推荐做法**：直接改 `packages/ai-core/src/index.ts`，然后：

```powershell
cd D:\handoff\ai-intel-handoff-20260511\code\packages\ai-core
npm run build     # 如果加了 build script
# 或者 ai-intel 下 npm install 重新链接
```

如果没 build script（现在就没有），next.config.mjs 里有 `transpilePackages: ["@mi/ai-core"]`，Next 会直接编译 TS 源码，**改完重启 dev 即可生效**。

---

## 跑不起来排查

见 `05-KNOWN-ISSUES.md`。最常见的三种：

1. `ETIMEDOUT` / `ECONNRESET` → 代理没开 or `HTTPS_PROXY` 写错
2. `[ai-core] AI 返回内容无法解析为 JSON` → `maxTokens` 被 thinking 吃光 → 确认 ai-core 里有 `reasoning_effort:"none"`
3. `better-sqlite3` 装不上 → 需要 node-gyp / MSVC build tools → `npm i --build-from-source` 或装 Visual Studio Build Tools
