/**
 * dump_pains.ts —— 从 DB 导出 Top 50 真实痛点清单
 * 直接读 SQLite，不走 Next API，避免 dev server 没开也能跑
 *
 * 输出：
 *   data/pains.md      人类可读 Top 50
 *   data/pains.json    机器可读全量
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/intel.db";
const TOP_N = Number(process.env.TOP_N || 50);

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ DB 不存在：${DB_PATH}\n先跑 npx tsx scripts/cheap_harvester.ts 抓数据`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

interface Row {
  id: number;
  created_at: string;
  source_platform: string;
  source_url: string | null;
  title: string;
  target_niche: string;
  pain_point_analysis: string;
  score: number;
  priority: string;
  tags: string;
  has_blueprint: number;
  analysis_json: string;
}

const rows = db
  .prepare(
    `SELECT id, created_at, source_platform, source_url, title,
            target_niche, pain_point_analysis, score, priority, tags,
            has_blueprint, analysis_json
     FROM opportunities
     ORDER BY score DESC, created_at DESC
     LIMIT ?`
  )
  .all(TOP_N) as Row[];

const total = (db.prepare("SELECT COUNT(*) c FROM opportunities").get() as any).c;

console.log(`📊 DB 中共 ${total} 条，导出 Top ${Math.min(TOP_N, rows.length)}`);

// ---------- pains.json ----------
const jsonOut = rows.map((r) => {
  let analysis: any = {};
  try { analysis = JSON.parse(r.analysis_json); } catch {}
  return {
    id: r.id,
    score: r.score,
    priority: r.priority,
    platform: r.source_platform,
    source_url: r.source_url,
    title: r.title,
    niche: r.target_niche,
    pain: r.pain_point_analysis,
    pain_point: analysis.pain_point,
    emotion_level: analysis.emotion_level,
    frequency_probability: analysis.frequency_probability,
    automation_possible: analysis.automation_possible,
    monetizable: analysis.monetizable,
    suggested_tool_type: analysis.suggested_tool_type,
    seo_potential: analysis.seo_potential,
    viral_potential: analysis.viral_potential,
    tags: r.tags,
  };
});
const jsonPath = path.join(path.dirname(DB_PATH), "pains.json");
fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), "utf8");

// ---------- pains.md ----------
const lines: string[] = [];
lines.push(`# 真实痛点 Top ${rows.length}`);
lines.push(``);
lines.push(`> 生成于 ${new Date().toISOString()}  |  来源：Reddit + Hacker News  |  全量 ${total} 条，按 score 降序取 Top ${rows.length}`);
lines.push(``);
lines.push(`## 📊 快览`);
const byNiche: Record<string, number> = {};
const byPriority: Record<string, number> = {};
for (const r of rows) {
  byNiche[r.target_niche] = (byNiche[r.target_niche] || 0) + 1;
  byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
}
lines.push(``);
lines.push(`**优先级分布**：` + Object.entries(byPriority).map(([k, v]) => `${k}=${v}`).join("  ·  "));
lines.push(``);
lines.push(`**Top Niche**：`);
Object.entries(byNiche)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([k, v]) => lines.push(`- ${k} × ${v}`));
lines.push(``);
lines.push(`---`);
lines.push(``);

rows.forEach((r, i) => {
  let a: any = {};
  try { a = JSON.parse(r.analysis_json); } catch {}
  lines.push(`## ${i + 1}. [${r.priority} · score ${r.score}] ${r.title}`);
  lines.push(``);
  lines.push(`- **Niche**：${r.target_niche}`);
  lines.push(`- **来源**：${r.source_platform} · [原帖](${r.source_url || "n/a"})`);
  if (a.pain_point) lines.push(`- **痛点**：${a.pain_point}`);
  if (a.emotion_level) lines.push(`- **情绪强度**：${a.emotion_level}/10`);
  if (a.frequency_probability) lines.push(`- **高频概率**：${a.frequency_probability}`);
  if (typeof a.monetizable !== "undefined") lines.push(`- **可变现**：${a.monetizable ? "✅" : "❌"}`);
  if (typeof a.automation_possible !== "undefined") lines.push(`- **可自动化**：${a.automation_possible ? "✅" : "❌"}`);
  if (a.suggested_tool_type) lines.push(`- **建议形态**：${a.suggested_tool_type}`);
  if (a.seo_potential) lines.push(`- **SEO 潜力**：${a.seo_potential}/10`);
  if (a.viral_potential) lines.push(`- **社媒传播**：${a.viral_potential}/10`);
  lines.push(``);
  if (r.pain_point_analysis) {
    lines.push(`**分析摘要**：`);
    lines.push(r.pain_point_analysis.trim());
    lines.push(``);
  }
  if (a.product_ideas && Array.isArray(a.product_ideas) && a.product_ideas.length) {
    lines.push(`**产品创意**：`);
    a.product_ideas.slice(0, 5).forEach((p: any) => {
      const name = p.name || p.title || "(未命名)";
      const desc = p.description || p.desc || "";
      const type = p.type ? ` _[${p.type}]_` : "";
      lines.push(`- **${name}**${type} — ${desc}`);
    });
    lines.push(``);
  }
  lines.push(`---`);
  lines.push(``);
});

const mdPath = path.join(path.dirname(DB_PATH), "pains.md");
fs.writeFileSync(mdPath, lines.join("\n"), "utf8");

console.log(`✅ 已生成：
  ${mdPath}
  ${jsonPath}

浏览建议：code ${mdPath}`);

db.close();
