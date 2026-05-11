"use client";

// 新版机会卡片 —— 围绕 score / target_niche / blueprint 三大字段
// 目的：让"值得做"的机会一眼识别，并能一键展开蓝图

import { useState } from "react";
import {
  Star,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlueprintView } from "@/components/blueprint-view";
import { formatDate, truncate } from "@/lib/utils";
import type { Opportunity, Priority } from "@/lib/types";

function priorityTone(p: Priority) {
  if (p === "P0") return "danger" as const;
  if (p === "P1") return "warn" as const;
  if (p === "P2") return "success" as const;
  return "muted" as const;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-red-300";
  if (score >= 60) return "text-amber-300";
  if (score >= 40) return "text-emerald-300";
  return "text-muted";
}

export function OpportunityCard({
  item,
  onChanged,
  defaultOpen = false,
}: {
  item: Opportunity;
  onChanged?: () => void;
  defaultOpen?: boolean;
}) {
  const [fav, setFav] = useState(!!item.favorite);
  const [open, setOpen] = useState(defaultOpen);

  async function toggleFav() {
    const r = await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, action: "toggleFavorite" }),
    });
    const j = await r.json();
    setFav(!!j.favorite);
    onChanged?.();
  }

  async function remove() {
    if (!confirm("确认删除这条机会？")) return;
    await fetch(`/api/opportunities?id=${item.id}`, { method: "DELETE" });
    onChanged?.();
  }

  const tags = item.tags ? item.tags.split(",").filter(Boolean) : [];

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold tabular-nums ${scoreColor(item.score)}`}>
                {item.score}
              </span>
              <h3 className="text-base font-semibold leading-tight text-fg">
                {item.title}
              </h3>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
              <Badge tone="muted">{item.target_niche}</Badge>
              <Badge tone="muted">{item.source_platform}</Badge>
              {item.build_once_sell_infinite ? (
                <Badge tone="success">
                  <Rocket className="h-3 w-3 mr-0.5" />
                  复卖零客服
                </Badge>
              ) : null}
              {item.has_blueprint ? (
                <Badge tone="warn">
                  <ShieldCheck className="h-3 w-3 mr-0.5" />
                  蓝图就绪
                </Badge>
              ) : null}
              {tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              {truncate(item.pain_point_analysis, 240)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" onClick={toggleFav} aria-label="收藏">
              <Star
                className={`h-4 w-4 ${fav ? "fill-amber-300 text-amber-300" : ""}`}
              />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen((v) => !v)}
              aria-label="展开"
            >
              {open ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button size="icon" variant="ghost" onClick={remove} aria-label="删除">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {open && (
          <div className="pt-3 border-t border-border space-y-4">
            <section>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1.5">
                Pain Point Analysis
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {item.pain_point_analysis}
              </p>
            </section>

            {item.has_blueprint && item.blueprint ? (
              <section>
                <div className="text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Technical Blueprint
                </div>
                <BlueprintView content={item.blueprint} />
              </section>
            ) : (
              <div className="text-xs text-muted p-3 rounded-md border border-dashed border-border">
                Score &lt; 80 或蓝图未生成 · 本机会暂未进入"可交付"队列
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted pt-1">
          <span>{formatDate(item.created_at)}</span>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-fg"
            >
              原文 <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
