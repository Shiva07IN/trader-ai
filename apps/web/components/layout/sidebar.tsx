"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  TrendingUp, LayoutDashboard, BriefcaseBusiness, Eye,
  BarChart3, Newspaper, Bell, MessageSquare, Settings,
  LogOut, ChevronLeft, ChevronRight, Filter, GitCompare,
  Calculator, Activity, Zap
} from "lucide-react";

const GROUPS = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard",           icon: LayoutDashboard,   label: "Dashboard" },
      { href: "/dashboard/portfolio", icon: BriefcaseBusiness, label: "Portfolio" },
      { href: "/dashboard/watchlist", icon: Eye,               label: "Watchlist" },
    ],
  },
  {
    label: "RESEARCH",
    items: [
      { href: "/dashboard/market",   icon: Activity,  label: "Market" },
      { href: "/dashboard/screener", icon: Filter,    label: "Screener" },
      { href: "/dashboard/compare",  icon: GitCompare,label: "Compare" },
      { href: "/dashboard/news",     icon: Newspaper, label: "News" },
    ],
  },
  {
    label: "TOOLS & AI",
    items: [
      { href: "/dashboard/insights", icon: Zap,           label: "AI Insights" },
      { href: "/dashboard/tools",    icon: Calculator,    label: "SIP Tools" },
      { href: "/dashboard/alerts",   icon: Bell,          label: "Alerts" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TrendingUp size={15} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            Trader<span style={{ color: "var(--primary-dim)" }}>AI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
        {GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && <div className="nav-group-label">{group.label}</div>}
            {group.items.map(({ href, icon: Icon, label }) => {
              const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} title={collapsed ? label : undefined}
                  className={`nav-item ${isActive ? "active" : ""}`}>
                  <Icon size={16} style={{ flexShrink: 0, color: isActive ? "var(--primary-dim)" : "inherit" }} />
                  {!collapsed && label}
                  {isActive && !collapsed && <div className="nav-dot" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "12px 0" }}>
        <Link href="/dashboard/settings" className="nav-item" title={collapsed ? "Settings" : undefined}>
          <Settings size={16} style={{ flexShrink: 0 }} />
          {!collapsed && "Settings"}
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <LogOut size={16} style={{ flexShrink: 0, color: "var(--danger)" }} />
          {!collapsed && <span style={{ color: "var(--danger)" }}>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ position: "absolute", right: -12, top: 72, width: 24, height: 24, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, transition: "border-color 150ms" }}>
        {collapsed ? <ChevronRight size={12} color="var(--text-muted)" /> : <ChevronLeft size={12} color="var(--text-muted)" />}
      </button>
    </aside>
  );
}
