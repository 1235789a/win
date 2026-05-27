
import Database from "better-sqlite3";

const db = new Database("./data/intel.db");
const p0s = db
  .prepare(
    "SELECT id, title, score, source_platform, source_url, target_niche, tags, created_at FROM opportunities WHERE priority = 'P0' ORDER BY score DESC, created_at DESC"
  )
  .all();

console.log("=== 31个P0高价值机会 ===\n");
p0s.forEach((p: any, i: number) => {
  console.log(`${i + 1}. ${p.title} (评分${p.score}, ${p.source_platform})`);
  console.log(`   目标用户: ${p.target_niche}`);
  console.log(`   链接: ${p.source_url}`);
  console.log(`   标签: ${p.tags}`);
  console.log();
});

db.close();
