// Dashboard（v2）：Can-Ship / Top Niches / Top Opportunities
import Link from "next/link";
import { getStats, listOpportunities } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpportunityCard } from "@/components/opportunity-card";
import { Sparkles, Flame, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getStats();
  const latest = listOpportunities({ limit: 5 });

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            冷酷客观 · 为海外华人企业/工作室发现"开发一次、无限复卖、零客服"的机会
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/analyze">
            <Button>
              <Sparkles className="h-4 w-4" />
              开始分析
            </Button>
          </Link>
          <Link href="/opportunities">
            <Button variant="outline">
              <Flame className="h-4 w-4" />
              机会列表
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="总机会数" value={stats.total} />
        <StatTile
          label="Can-Ship（可交付）"
          value={stats.can_ship}
          tone="success"
          hint="score ≥ 80 且蓝图就绪"
        />
        <StatTile label="平均分" value={stats.avg_score} />
        <StatTile label="最高分" value={stats.max_score} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stats.top_opportunities.length === 0 && (
              <EmptyHint text="还没有数据，去 Analyze 页面粘贴一段内容试试" />
            )}
            {stats.top_opportunities.map((p) => (
              <Link
                key={p.id}
                href={`/opportunities?id=${p.id}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors"
              >
                <Badge>{p.score}</Badge>
                <span className="flex-1 text-sm leading-snug truncate">
                  {p.title}
                </span>
                <span className="text-[11px] text-muted shrink-0 max-w-[40%] truncate">
                  {p.target_niche}
                </span>
                {p.has_blueprint ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                ) : null}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Niches（按海外华人细分）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.by_niche.length === 0 && <EmptyHint text="暂无细分数据" />}
            {stats.by_niche.map((c) => (
              <div
                key={c.target_niche}
                className="flex items-center justify-between text-sm gap-3"
              >
                <span className="truncate flex-1" title={c.target_niche}>
                  {c.target_niche}
                </span>
                <div className="w-28 h-1.5 bg-white/5 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-white/70"
                    style={{
                      width: `${
                        (c.count /
                          Math.max(1, ...stats.by_niche.map((x) => x.count))) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <Badge tone="muted">{c.count}</Badge>
                <Badge>avg {c.avg_score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">最新机会</h2>
          <Link
            href="/opportunities"
            className="text-xs text-muted hover:text-fg"
          >
            查看全部 →
          </Link>
        </div>
        {latest.length === 0 ? (
          <EmptyHint text="空空如也 · 去 Analyze 页面投喂第一条数据吧" />
        ) : (
          <div className="space-y-3">
            {latest.map((o) => (
              <OpportunityCard key={o.id} item={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone?: "success";
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel/60 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "success" ? "text-emerald-300" : ""
        }`}
      >
        {value}
      </div>
      {hint ? (
        <div className="text-[10px] text-muted mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-xs text-muted p-4 rounded-md border border-dashed border-border">
      {text}
    </div>
  );
}
