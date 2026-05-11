import { AnalyzeForm } from "@/components/analyze-form";

export const dynamic = "force-dynamic";

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze</h1>
        <p className="text-sm text-muted mt-1">
          粘贴原始内容 / URL → 系统自动清洗 → Claude / GPT 抽取痛点 → 打分入库
        </p>
      </header>
      <AnalyzeForm />
    </div>
  );
}
