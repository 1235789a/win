import { cn } from "@/lib/utils";

export function ScoreBar({
  label,
  value,
  max = 10,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="w-20 text-xs text-muted">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-white/80"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums">{value}</span>
    </div>
  );
}
