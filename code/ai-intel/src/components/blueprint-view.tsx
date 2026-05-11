"use client";

// Blueprint 渲染：Markdown + 代码块 + 一键复制
// 风格：Linear / Notion 冷灰科技感

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlueprintView({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted">
          蓝图 · {content.length.toLocaleString()} 字符
        </span>
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              复制蓝图
            </>
          )}
        </Button>
      </div>
      <article
        className={cn(
          "prose prose-invert prose-sm max-w-none",
          "text-fg/90",
          "[&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm",
          "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold",
          "[&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-3",
          "[&_p]:leading-relaxed [&_p]:my-2",
          "[&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5",
          "[&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-white/10 [&_code]:text-[12px]",
          "[&_pre]:bg-black [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:overflow-x-auto",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[12px] [&_pre_code]:leading-relaxed",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_blockquote]:italic",
          "[&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1",
          "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
          "[&_hr]:border-border [&_hr]:my-4",
          "[&_a]:text-white [&_a]:underline [&_a]:underline-offset-2"
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
