// 给 Phase C 之前入库的 opportunities 追补 pain_mentions
// 每个 opportunity 追认一条 mention，用 created_at 作为目击时间

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { listOpportunities } from "../src/lib/db";
import { recordMention } from "../src/lib/trends";
import { getRawDB } from "../src/lib/db";

const all = listOpportunities({ limit: 10000 });
const db = getRawDB();

let added = 0;
let skipped = 0;
for (const o of all) {
  // 检查是否已经有 mention（按 opportunity_id 幂等）
  const exists = db
    .prepare("SELECT 1 as x FROM pain_mentions WHERE opportunity_id = ? LIMIT 1")
    .get(o.id);
  if (exists) {
    skipped++;
    continue;
  }
  recordMention({
    cluster_id: (o as any).cluster_id ?? null,
    opportunity_id: o.id,
    source_platform: o.source_platform,
    mentioned_at: o.created_at,
    engagement: 0,
    text_sample: (o.raw_text ?? "").slice(0, 200),
  });
  added++;
}

console.log(`backfilled ${added} mentions  (skipped ${skipped} already-present)`);
