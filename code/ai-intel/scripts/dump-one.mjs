// 从 DB 回读 id=7（刚刚新跑的 Upwork），写到文件看质量
import Database from "better-sqlite3";
import fs from "node:fs";

const db = new Database("data/intel.db", { readonly: true });
const row = db.prepare(
  "SELECT id,title,score,target_niche,tags,pain_point_analysis,blueprint FROM opportunities ORDER BY id DESC LIMIT 1"
).get();

console.log("id:   ", row.id);
console.log("score:", row.score);
console.log("title:", row.title);
console.log("niche:", row.target_niche);
console.log("bp_len:", row.blueprint?.length || 0);

const out = `# ${row.title}  (id=${row.id}, score=${row.score})

**Niche:** ${row.target_niche}
**Tags:** ${row.tags}

## 痛点分析
${row.pain_point_analysis}

## 技术蓝图
${row.blueprint}
`;
fs.writeFileSync("data/latest-brief.md", out, "utf8");
console.log("→ 写入 data/latest-brief.md");
