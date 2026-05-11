// 文本清洗：去广告、去模板噪声、归一化换行
// 原则：不做过度删减，保留用户口吻，AI 层才能识别情绪

const AD_PATTERNS: RegExp[] = [
  /\bsubscribe( to)? (our|my) newsletter\b/gi,
  /\bfollow me on (twitter|x|instagram|tiktok)\b/gi,
  /\bclick here to\b/gi,
  /\bsponsored by\b/gi,
  /\[deleted\]/gi,
  /\[removed\]/gi,
];

export function cleanText(input: string): string {
  if (!input) return "";
  let t = input;

  // 归一化换行与空格
  t = t.replace(/\r\n/g, "\n").replace(/\t/g, "  ");
  // 去零宽字符
  t = t.replace(/[\u200B-\u200D\uFEFF]/g, "");
  // 折叠 3+ 换行
  t = t.replace(/\n{3,}/g, "\n\n");
  // 去广告模板
  for (const p of AD_PATTERNS) t = t.replace(p, "");
  // 去每行首尾空格
  t = t
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");

  // 超长截断（Claude/GPT 都能处理，但超过 40k 字会浪费 token）
  const MAX = 40_000;
  if (t.length > MAX) {
    t = t.slice(0, MAX) + "\n\n...[truncated]";
  }
  return t.trim();
}
