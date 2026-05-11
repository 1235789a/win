// URL 抓取 → 正文 + 评论（尽力而为）
// 特化处理 Reddit / HackerNews，其他走通用 HTML 抽取

import * as cheerio from "cheerio";
import type { SourcePlatform } from "./types";

export interface FetchedContent {
  platform: SourcePlatform;
  url: string;
  title: string;
  text: string;
}

const UA =
  "Mozilla/5.0 (compatible; AI-Intel/0.1; +https://example.local)";

export function detectPlatform(url: string): SourcePlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("reddit.com")) return "reddit";
    if (host === "news.ycombinator.com") return "hackernews";
    if (host === "producthunt.com" || host.endsWith(".producthunt.com"))
      return "producthunt";
    if (host === "x.com" || host === "twitter.com") return "x";
    if (host.endsWith(".rss") || u.pathname.endsWith(".xml")) return "rss";
    return "url";
  } catch {
    return "url";
  }
}

async function fetchReddit(url: string): Promise<FetchedContent> {
  // Reddit 公开 JSON：URL 末尾加 .json
  const jsonUrl = url.replace(/\/?$/, "") + ".json";
  const r = await fetch(jsonUrl, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`Reddit fetch failed: ${r.status}`);
  const data = (await r.json()) as any;

  const post = data?.[0]?.data?.children?.[0]?.data;
  const comments = data?.[1]?.data?.children ?? [];
  const title: string = post?.title ?? "";
  const selftext: string = post?.selftext ?? "";

  const topComments = comments
    .slice(0, 30)
    .map((c: any) => c?.data?.body)
    .filter((b: unknown): b is string => typeof b === "string");

  const text = [
    `标题: ${title}`,
    selftext ? `正文: ${selftext}` : "",
    topComments.length ? `评论:\n- ${topComments.join("\n- ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { platform: "reddit", url, title, text };
}

async function fetchHN(url: string): Promise<FetchedContent> {
  const m = url.match(/id=(\d+)/);
  if (!m) throw new Error("HN URL 需要包含 ?id=xxx");
  const id = m[1];
  const apiBase = "https://hacker-news.firebaseio.com/v0";

  const item = await fetch(`${apiBase}/item/${id}.json`).then((r) => r.json());
  const title: string = item?.title ?? "";
  const selftext: string = item?.text ?? "";
  const kids: number[] = (item?.kids ?? []).slice(0, 30);

  const comments: string[] = [];
  for (const kid of kids) {
    try {
      const c: any = await fetch(`${apiBase}/item/${kid}.json`).then((r) =>
        r.json()
      );
      if (c?.text) comments.push(stripHtml(c.text));
    } catch {
      /* ignore single fail */
    }
  }

  const text = [
    `标题: ${title}`,
    selftext ? `正文: ${stripHtml(selftext)}` : "",
    comments.length ? `评论:\n- ${comments.join("\n- ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { platform: "hackernews", url, title, text };
}

async function fetchGeneric(url: string): Promise<FetchedContent> {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
  const html = await r.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    "";

  // 去脚本/样式/导航
  $("script, style, noscript, nav, footer, header, svg").remove();

  // 优先 article / main
  const main =
    $("article").first().text() ||
    $("main").first().text() ||
    $("body").text();

  const text = main.replace(/\s+/g, " ").trim();
  return { platform: detectPlatform(url), url, title: title.trim(), text };
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
}

export async function fetchURL(url: string): Promise<FetchedContent> {
  const platform = detectPlatform(url);
  if (platform === "reddit") return fetchReddit(url);
  if (platform === "hackernews") return fetchHN(url);
  return fetchGeneric(url);
}
