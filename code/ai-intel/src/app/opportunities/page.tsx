"use client";

// Opportunities 列表：搜索 / 最低分 / 只看可交付 / 只看收藏 / 优先级

import { useCallback, useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpportunityCard } from "@/components/opportunity-card";
import type { Opportunity, Priority } from "@/lib/types";

const PRIORITIES: (Priority | "all")[] = ["all", "P0", "P1", "P2", "P3"];

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("all");
  const [minScore, setMinScore] = useState(0);
  const [favOnly, setFavOnly] = useState(false);
  const [blueprintOnly, setBlueprintOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (priority !== "all") params.set("priority", priority);
    if (minScore > 0) params.set("minScore", String(minScore));
    if (favOnly) params.set("favoriteOnly", "1");
    if (blueprintOnly) params.set("hasBlueprint", "1");
    params.set("limit", "100");
    const r = await fetch("/api/opportunities?" + params.toString());
    const j = await r.json();
    setItems(j.items ?? []);
    setLoading(false);
  }, [q, priority, minScore, favOnly, blueprintOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        <p className="text-sm text-muted mt-1">
          按 score 倒序 · 支持搜索 / 优先级 / 最低分 / 蓝图 / 收藏
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="搜索 title / analysis / niche / tags..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-9"
            />
          </div>
          <Button
            variant={blueprintOnly ? "default" : "outline"}
            onClick={() => setBlueprintOnly((v) => !v)}
          >
            <ShieldCheck className="h-4 w-4" />
            只看可交付
          </Button>
          <Button
            variant={favOnly ? "default" : "outline"}
            onClick={() => setFavOnly((v) => !v)}
          >
            {favOnly ? "★" : "☆"} 只看收藏
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                priority === p
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-muted border-border hover:text-fg"
              }`}
            >
              {p}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-muted">
            最低分
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
      </div>

      <div className="space-y-3">
        {loading && <div className="text-xs text-muted">加载中...</div>}
        {!loading && items.length === 0 && (
          <div className="text-xs text-muted p-8 text-center rounded-md border border-dashed border-border">
            没有匹配的机会
          </div>
        )}
        {items.map((o) => (
          <OpportunityCard key={o.id} item={o} onChanged={load} />
        ))}
      </div>
    </div>
  );
}
