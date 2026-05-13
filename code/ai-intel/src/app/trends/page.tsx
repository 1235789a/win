"use client";

// Trends 页：按 Why Now 时机信号排序的机会榜
// 每张卡片 = 一个 cluster，展示 base/boosted/why_now 三层分数 + 催化剂 + 窗口期

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Zap, Clock, Globe, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrendItem {
  cluster_id: number;
  title: string;
  niche: string;
  tags: string;
  member_count: number;
  canonical_opportunity_id: number | null;
  base_score: number;
  cross_signal: {
    sources: string[];
    source_count: number;
    cross_boost: number;
    has_upwork: boolean;
  };
  boosted_score: number;
  trend: {
    mentions_7d: number;
    mentions_30d: number;
    mentions_90d: number;
    growth_7d_pct: number;
    growth_30d_pct: number;
    unique_sources_30d: number;
    last_mention_at: string | null;
    recency_ratio: number;
  };
  why_now: {
    score: number;
    label: "爆发中" | "升温中" | "稳定" | "停滞" | "无数据";
    growth_score: number;
    catalyst_score: number;
    recency_score: number;
    diversity_score: number;
    matched_catalysts: {
      name: string;
      category: string;
      days_ago: number;
      matched: string[];
    }[];
    window_months: number;
  };
  final_score: number;
}

export default function TrendsPage() {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);
  const [label, setLabel] = useState<"all" | TrendItem["why_now"]["label"]>(
    "all"
  );

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (minScore > 0) params.set("min_score", String(minScore));
    fetch(`/api/trends?${params}`)
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items ?? []);
        setLoading(false);
      });
  }, [minScore]);

  const filtered =
    label === "all" ? items : items.filter((i) => i.why_now.label === label);

  const counts = {
    all: items.length,
    "爆发中": items.filter((i) => i.why_now.label === "爆发中").length,
    "升温中": items.filter((i) => i.why_now.label === "升温中").length,
    "稳定": items.filter((i) => i.why_now.label === "稳定").length,
    "停滞": items.filter((i) => i.why_now.label === "停滞").length,
    "无数据": items.filter((i) => i.why_now.label === "无数据").length,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Trends · Why Now
        </h1>
        <p className="text-sm text-muted mt-1">
          综合分 = 基础分 × (0.6 + 0.4 × Why Now / 100)。 命中技术催化剂 / 高增速 / 多平台
          = 黄金窗口期。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        {(["all", "爆发中", "升温中", "稳定", "停滞", "无数据"] as const).map(
          (l) => (
            <button
              key={l}
              onClick={() => setLabel(l)}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                label === l
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-muted border-border hover:text-fg"
              }`}
            >
              {l === "all" ? "全部" : l}
              <span className="ml-1 text-[10px] opacity-70">
                {counts[l as keyof typeof counts]}
              </span>
            </button>
          )
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-muted">
          最低基础分
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-32"
          />
          <Badge>{minScore}</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-xs text-muted">加载中...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-xs text-muted p-8 text-center rounded-md border border-dashed border-border">
            没有匹配的 cluster
          </div>
        )}
        {filtered.map((it) => (
          <TrendCard key={it.cluster_id} item={it} />
        ))}
      </div>
    </div>
  );
}

function TrendCard({ item }: { item: TrendItem }) {
  const wn = item.why_now;
  const cs = item.cross_signal;
  const tags = (item.tags || "").split(",").filter(Boolean).slice(0, 6);

  const emoji =
    wn.label === "爆发中"
      ? "🔥"
      : wn.label === "升温中"
      ? "📈"
      : wn.label === "稳定"
      ? "🟢"
      : wn.label === "停滞"
      ? "💤"
      : "⚫";

  const finalColor =
    item.final_score >= 85
      ? "text-red-300"
      : item.final_score >= 70
      ? "text-amber-300"
      : item.final_score >= 50
      ? "text-emerald-300"
      : "text-muted";

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center shrink-0 min-w-[88px]">
            <span className={`text-4xl font-bold tabular-nums ${finalColor}`}>
              {item.final_score}
            </span>
            <span className="text-[10px] text-muted uppercase tracking-wider">
              final
            </span>
            <div className="flex gap-1 mt-1 text-[10px] text-muted tabular-nums">
              <span>base {item.base_score}</span>
              <span>·</span>
              <span>why {wn.score}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Badge
                tone={
                  wn.label === "爆发中"
                    ? "danger"
                    : wn.label === "升温中"
                    ? "warn"
                    : wn.label === "稳定"
                    ? "success"
                    : "muted"
                }
              >
                {emoji} {wn.label}
              </Badge>
              <h3 className="text-base font-semibold leading-tight">
                {item.title}
              </h3>
            </div>
            <div className="mt-1.5 text-xs text-muted truncate">
              {item.niche}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="muted">
                <Globe className="h-3 w-3 mr-0.5" />
                {cs.source_count}源: {cs.sources.join(",") || "—"}
              </Badge>
              {cs.has_upwork && (
                <Badge tone="warn">
                  <DollarSign className="h-3 w-3 mr-0.5" />
                  有人悬赏
                </Badge>
              )}
              {cs.cross_boost > 0 && (
                <Badge tone="success">+{cs.cross_boost} 跨源</Badge>
              )}
              <Badge tone="muted">
                <Clock className="h-3 w-3 mr-0.5" />窗口 ~{wn.window_months}mo
              </Badge>
              <Badge tone="muted">{item.member_count} 条</Badge>
            </div>

            {wn.matched_catalysts.length > 0 && (
              <div className="mt-2 space-y-1">
                {wn.matched_catalysts.slice(0, 3).map((m, i) => (
                  <div
                    key={i}
                    className="text-[11px] flex items-center gap-1.5 text-amber-200"
                  >
                    <Zap className="h-3 w-3 shrink-0" />
                    <span className="truncate">{m.name}</span>
                    <span className="text-muted shrink-0">
                      · {m.days_ago}天前
                    </span>
                    <span className="text-muted shrink-0 truncate">
                      → {m.matched.slice(0, 2).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-muted">
              <Meter label="增速" value={wn.growth_score} />
              <Meter label="催化剂" value={wn.catalyst_score} />
              <Meter label="新鲜度" value={wn.recency_score} />
              <Meter label="多源" value={wn.diversity_score} />
            </div>

            <div className="mt-2 text-[10px] text-muted flex flex-wrap gap-x-3 gap-y-0.5">
              <span>30d: {item.trend.mentions_30d} 次</span>
              <span>
                环比:{" "}
                <span
                  className={
                    item.trend.growth_30d_pct > 0
                      ? "text-emerald-300"
                      : item.trend.growth_30d_pct < 0
                      ? "text-red-300"
                      : ""
                  }
                >
                  {item.trend.growth_30d_pct >= 0 ? "+" : ""}
                  {(item.trend.growth_30d_pct * 100).toFixed(0)}%
                </span>
              </span>
              {tags.length > 0 && (
                <span className="truncate">
                  #{tags.join(" · #").slice(0, 80)}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {item.canonical_opportunity_id && (
              <Link
                href={`/opportunities?id=${item.canonical_opportunity_id}`}
                className="text-[11px] text-muted hover:text-fg inline-flex items-center gap-1"
              >
                <Flame className="h-3 w-3" />
                详情
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1 mt-0.5 rounded bg-white/5 overflow-hidden">
        <div
          className="h-full bg-white/60"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
