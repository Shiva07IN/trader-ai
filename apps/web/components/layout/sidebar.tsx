"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, BriefcaseBusiness, Eye,
  Filter, Newspaper, Lightbulb, Settings, Brain, LogOut,
  ChevronLeft, ChevronRight, Activity, GitCompare,
  Calculator, Bell, BarChart3
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { href: "/dashboard",           icon: LayoutDashboard, label: "Dashboard",   group: "core" },
  { href: "/dashboard/portfolio", icon: BriefcaseBusiness, label: "Portfolio", group: "core" },
  { href: "/dashboard/watchlist", icon: Eye,             label: "Watchlist",   group: "core" },
  // ── Research ──────────────────────────────────────────────────────────────
  { href: "/dashboard/market",    icon: Activity,        label: "Market",      group: "research" },
  { href: "/dashboard/screener",  icon: Filter,          label: "Screener",    group: "research" },
  { href: "/dashboard/compare",   icon: GitCompare,      label: "Compare",     group: "research" },
  { href: "/dashboard/news",      icon: Newspaper,       label: "News",        group: "research" },
  // ── Tools & AI ────────────────────────────────────────────────────────────
  { href: "/dashboard/insights",  icon: Lightbulb,       label: "AI Insights", group: "tools" },
  { href: "/dashboard/tools",     icon: Calculator,      label: "SIP Tools",   group: "tools" },
  { href: "/dashboard/alerts",    icon: Bell,            label: "Alerts",      group: "tools" },
];

const GROUPS: Record<string, string> = {
  core:     "Main",
  research: "Research",
  tools:    "Tools & AI",
};

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const groupedItems = (Object.keys(GROUPS) as string[]).map(group => ({
    group,
    label: GROUPS[group],
    items: NAV_ITEMS.filter(n => n.group === group),
  }));

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen sticky top-0 border-r border-white/5 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: "rgba(5, 8, 17, 0.9)", backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-white whitespace-nowrap">
            Trader<span className="text-gradient">AI</span>
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {groupedItems.map(({ group, label, items }) => (
          <div key={group}>
            {!collapsed && (
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-700">{label}</div>
            )}
            <div className="space-y-0.5">
              {items.map(({ href, icon: Icon, label: itemLabel }) => {
                const active = href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} title={collapsed ? itemLabel : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    )}>
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-indigo-400")} />
                    {!collapsed && <span className="whitespace-nowrap">{itemLabel}</span>}
                    {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-white/5 space-y-1">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-white/10 bg-surface-800 flex items-center justify-center hover:border-indigo-500/40 transition-colors z-10">
        {collapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronLeft className="w-3 h-3 text-slate-500" />}
      </button>
    </aside>
  );
}
