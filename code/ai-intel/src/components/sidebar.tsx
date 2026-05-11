"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Flame,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze", icon: Sparkles },
  { href: "/opportunities", label: "Opportunities", icon: Flame },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-border bg-bg">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <span className="text-sm font-semibold tracking-tight">
          AI Intel <span className="text-muted font-normal">· MVP</span>
        </span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/5 text-fg"
                  : "text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border text-[11px] text-muted flex items-center gap-2">
        <Github className="h-3 w-3" /> local-first · v0.1
      </div>
    </aside>
  );
}
