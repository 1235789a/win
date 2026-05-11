import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warn" | "danger" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-white/10 text-fg border-white/10",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  danger: "bg-red-500/15 text-red-300 border-red-500/20",
  muted: "bg-white/5 text-muted border-white/10",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
