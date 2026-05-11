import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full rounded-md border border-border bg-panel px-3 py-2 text-sm",
      "placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30",
      "min-h-[140px] resize-y",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
