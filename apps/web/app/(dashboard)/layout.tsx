"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, Bell, Command } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="dashboard-layout" style={{ position: "relative" }}>
      <Sidebar />

      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-disabled)" }} />
            <input
              type="text"
              placeholder="Search stocks, sectors, or ask AI..."
              className="input"
              style={{ paddingLeft: 36, paddingRight: 80, height: 36, fontSize: 13, borderRadius: 8 }}
            />
            <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--text-disabled)", fontWeight: 600 }}>
              <Command size={10} /> K
            </div>
          </div>

          {/* Index chips */}
          <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
            {[
              { label: "NIFTY", val: "22,456", chg: "+0.80%", up: true },
              { label: "SENSEX", val: "73,852", chg: "+0.77%", up: true },
            ].map(idx => (
              <div key={idx.label} className="index-chip">
                <span className="index-name">{idx.label}</span>
                <span className="index-value">{idx.val}</span>
                <span className={`index-change ${idx.up ? "up" : "down"}`}>{idx.chg}</span>
              </div>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notification */}
            <button style={{ position: "relative", background: "none", border: "1px solid var(--border-subtle)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", transition: "border-color 150ms" }}>
              <Bell size={15} />
              <div style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", border: "2px solid var(--bg-base)" }} />
            </button>

            {/* User avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {session?.user?.name?.[0]?.toUpperCase() || "S"}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                {session?.user?.name?.split(" ")[0] || "Shivam"}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
