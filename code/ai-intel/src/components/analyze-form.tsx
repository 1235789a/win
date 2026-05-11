"use client";

import { useState } from "react";
import { Loader2, Wand2, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlueprintView } from "@/components/blueprint-view";
import type { AnalysisResult, Priority } from "@/lib/types";

interface AnalyzeResponse {
  platform?: string;
  source_url?: string | null;
  analysis: AnalysisResult;
  priority: Priority;
  has_blueprint: boolean;
  saved_id?: number | null;
  error?: string;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-red-300";
  if (score >= 60) return "text-amber-300";
  if (score >= 40) return "text-emerald-300";
  return "text-muted";
}

function priorityTone(p: Priority) {
  if (p === "P0") return "danger" as const;
  if (p === "P1") return "warn" as const;
  if (p === "P2") return "success" as const;
  return "muted" as const;
}

export function AnalyzeForm() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AnalyzeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function prefillFromUrl() {
    if (!url) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "fetch failed");
      setText(j.text?.slice(0, 12000) ?? "");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setErr(null);
    setRes(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url: url || undefined }),
      });
      const j = (await r.json()) as AnalyzeResponse;
      if (!r.ok) throw new Error(j.error || "analyze failed");
      setRes(j);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>粘贴内容或 URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://reddit.com/... / HN / Product Hunt / 任意文章 URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={prefillFromUrl}
              disabled={loading || !url}
            >
              抓取
            </Button>
          </div>
          <Textarea
            placeholder="或直接粘贴 Reddit / X / HN / PH / 论坛 / 微信群 聊天/帖子。冷酷架构师会判断这里是否藏着可做成 SaaS 的机会。"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[240px] font-mono text-[13px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {text.length} 字符 · score ≥ 80 会触发 800+ 字技术蓝图（需要 30-90 秒）
            </span>
            <Button
              onClick={analyze}
              disabled={loading || (!text && !url)}
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              开始分析
            </Button>
          </div>
          {err && (
            <div className="text-xs text-red-400 border border-red-500/30 rounded-md p-2 bg-red-500/5">
              {err}
            </div>
          )}
        </CardContent>
      </Card>

      {res && <AnalyzeResultView res={res} />}
    </div>
  );
}

function AnalyzeResultView({ res }: { res: AnalyzeResponse }) {
  const { analysis, priority, has_blueprint } = res;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-5 flex-wrap">
            <div
              className={`text-5xl font-bold tabular-nums leading-none ${scoreColor(
                analysis.score
              )}`}
            >
              {analysis.score}
            </div>
            <div className="flex-1 min-w-[240px]">
              <h2 className="text-lg font-semibold">{analysis.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={priorityTone(priority)}>{priority}</Badge>
                <Badge tone="muted">{analysis.target_niche}</Badge>
                {analysis.build_once_sell_infinite ? (
                  <Badge tone="success">
                    <Rocket className="h-3 w-3 mr-0.5" />
                    复卖零客服
                  </Badge>
                ) : null}
                {has_blueprint ? (
                  <Badge tone="warn">
                    <ShieldCheck className="h-3 w-3 mr-0.5" />
                    蓝图就绪
                  </Badge>
                ) : null}
                {analysis.tags.map((t) => (
                  <Badge key={t}>#{t}</Badge>
                ))}
              </div>
              {res.saved_id ? (
                <p className="text-xs text-emerald-300 mt-2">
                  已入库，ID #{res.saved_id}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pain Point Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {analysis.pain_point_analysis}
          </p>
        </CardContent>
      </Card>

      {has_blueprint && analysis.blueprint ? (
        <Card>
          <CardHeader>
            <CardTitle>Technical Blueprint</CardTitle>
          </CardHeader>
          <CardContent>
            <BlueprintView content={analysis.blueprint} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="text-xs text-muted">
              Score &lt; 80，AI 判定此机会未达到"值得开发"阈值，未生成蓝图。
              可尝试换一段内容或补充更多用户抱怨细节再试。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
