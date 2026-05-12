"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  TrendingUp, TrendingDown, ArrowUpRight, Zap,
  BarChart3, Newspaper, ChevronRight, Plus
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { api } from "@/lib/api";

const INDICES = [
  { label: "NIFTY 50",   val: "22,456.80", chg: "+178.40", pct: "+0.80%", up: true },
  { label: "SENSEX",     val: "73,852.64", chg: "+562.18", pct: "+0.77%", up: true },
  { label: "BANK NIFTY", val: "48,234.55", chg: "-124.30", pct: "-0.26%", up: false },
  { label: "INDIA VIX",  val: "13.45",     chg: "-0.82",   pct: "-5.74%", up: false },
];

const PORTFOLIO_DATA = [
  { m: "Nov", v: 520000 }, { m: "Dec", v: 548000 }, { m: "Jan", v: 561000 },
  { m: "Feb", v: 595000 }, { m: "Mar", v: 621000 }, { m: "Apr", v: 658000 },
  { m: "May", v: 784250 },
];

const TRENDING = [
  { sym: "RELIANCE", name: "Reliance Industries",  price: "2,847.50", pct: "+2.31%", up: true },
  { sym: "TCS",      name: "Tata Consultancy",     price: "3,924.00", pct: "-0.82%", up: false },
  { sym: "INFY",     name: "Infosys Ltd.",          price: "1,634.75", pct: "+1.42%", up: true },
  { sym: "HDFC",     name: "HDFC Bank",             price: "1,742.50", pct: "+0.64%", up: true },
  { sym: "WIPRO",    name: "Wipro Ltd.",            price: "498.30",   pct: "-1.22%", up: false },
];

const SECTORS = [
  { name: "IT",       pct: "+2.1%",  intensity: 0.85, up: true  },
  { name: "PHARMA",   pct: "+1.4%",  intensity: 0.55, up: true  },
  { name: "BANK",     pct: "-0.8%",  intensity: 0.35, up: false },
  { name: "AUTO",     pct: "+0.3%",  intensity: 0.15, up: true  },
  { name: "FMCG",     pct: "-0.5%",  intensity: 0.22, up: false },
  { name: "ENERGY",   pct: "-1.2%",  intensity: 0.50, up: false },
  { name: "METALS",   pct: "+3.1%",  intensity: 1.00, up: true  },
  { name: "REALTY",   pct: "+1.8%",  intensity: 0.70, up: true  },
];

const WATCHLIST = [
  { sym: "RELIANCE",  price: "2,847.50", pct: "+2.31%", up: true  },
  { sym: "TCS",       price: "3,924.00", pct: "-0.82%", up: false },
  { sym: "INFY",      price: "1,634.75", pct: "+1.42%", up: true  },
  { sym: "HDFC",      price: "1,742.50", pct: "+0.64%", up: true  },
  { sym: "WIPRO",     price: "498.30",   pct: "-1.22%", up: false },
  { sym: "BAJFINANCE",price: "6,924.00", pct: "+0.42%", up: true  },
];

const NEWS = [
  { sentiment: "bullish", headline: "Nifty hits new high, IT sector leads broad-based rally", source: "ET Markets",    time: "2m ago" },
  { sentiment: "bearish", headline: "FII outflows continue for 3rd straight week amid global sell-off", source: "Moneycontrol", time: "14m ago" },
  { sentiment: "bullish", headline: "RBI holds repo rate, markets cheer accommodative stance", source: "Mint",           time: "1h ago" },
  { sentiment: "neutral", headline: "Q4 earnings season: Mixed results from banking sector", source: "Business Std.",   time: "2h ago" },
];

function IndexCard({ d }: { d: typeof INDICES[0] }) {
  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="stat-label">{d.label}</div>
      <div className="stat-value" style={{ fontSize: 19 }}>{d.val}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className={`pnl-badge ${d.up ? "pnl-up" : "pnl-down"}`}>
          {d.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {d.pct}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>{d.chg}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: "var(--primary-dim)" }}>
        ₹{(payload[0].value / 1e5).toFixed(2)}L
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("3M");
  const tabs = ["1W","1M","3M","6M","1Y"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div style={{ minWidth: 0 }}>

        {/* Index cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {INDICES.map(d => <IndexCard key={d.label} d={d} />)}
        </div>

        {/* Portfolio chart */}
        <div className="chart-container" style={{ marginBottom: 20 }}>
          <div className="chart-header">
            <div>
              <div className="section-title">Portfolio Performance</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>May 2026</div>
            </div>
            <div className="time-tabs">
              {tabs.map(t => (
                <button key={t} className={`time-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: "8px 4px 4px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={PORTFOLIO_DATA}>
                <defs>
                  <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--text-disabled)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-disabled)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1e5).toFixed(0)}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="v" stroke="#4F46E5" strokeWidth={2} fill="url(#portGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid var(--border-subtle)" }}>
            {[
              { label: "Total Value",     val: "₹7,84,250", color: "var(--text-primary)" },
              { label: "Day P&L",         val: "+₹12,340",  color: "var(--success)", sub: "+1.60%" },
              { label: "Overall Return",  val: "+50.8%",     color: "var(--success)", sub: "+₹2,61,840" },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: "14px 20px", borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.val}</div>
                {s.sub && <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--success)", marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Trending stocks */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-header">
            <span className="section-title">Trending Now</span>
            <Link href="/dashboard/screener" className="section-action">View all →</Link>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {TRENDING.map(s => (
              <Link key={s.sym} href={`/dashboard/stocks/${s.sym}`}
                style={{ flexShrink: 0, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "12px 14px", width: 148, textDecoration: "none", transition: "border-color 150ms, box-shadow 150ms", display: "block" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(79,70,229,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{s.sym}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>{s.name}</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>₹{s.price}</div>
                <div className={`pnl-badge ${s.up ? "pnl-up" : "pnl-down"}`} style={{ marginTop: 6, fontSize: 10 }}>
                  {s.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {s.pct}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sector Heatmap */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <span className="section-title">Sector Heatmap</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Today, 12 May 2026</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {SECTORS.map(s => {
              const green = [0.12 + s.intensity * 0.18, 0.50 + s.intensity * 0.35, 0.16 + s.intensity * 0.12];
              const red   = [0.52 + s.intensity * 0.25, 0.06, 0.06];
              const [r,g,b] = s.up ? green : red;
              const bg = s.up
                ? `rgba(${Math.round(r*30)},${Math.round(g*255)},${Math.round(b*100)},0.85)`
                : `rgba(${Math.round(r*255)},${Math.round(g*40)},${Math.round(b*40)},0.85)`;
              return (
                <div key={s.name} className="heatmap-cell" style={{ background: bg, color: "#fff" }}>
                  <span className="heatmap-name">{s.name}</span>
                  <span className="heatmap-pct">{s.pct}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

        {/* AI Insights */}
        <div className="card-ai" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Zap size={15} color="var(--primary-dim)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's AI Analysis</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 14 }}>
            NIFTY showing strong momentum above 22,400 support. IT sector leading with broad-based institutional buying. Watch INFY earnings trigger.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Analyze my portfolio", "Best buys today", "Market outlook"].map(q => (
              <Link key={q} href="/dashboard/insights" className="badge badge-primary" style={{ cursor: "pointer", textDecoration: "none", fontSize: 11 }}>{q}</Link>
            ))}
          </div>
        </div>

        {/* Watchlist */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span className="section-title" style={{ fontSize: 13 }}>Watchlist</span>
            <Link href="/dashboard/watchlist" className="section-action">Edit</Link>
          </div>
          {WATCHLIST.map(s => (
            <Link key={s.sym} href={`/dashboard/stocks/${s.sym}`}
              style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none", transition: "background 120ms", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{s.sym}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>₹{s.price}</div>
                <div className={`pnl-badge ${s.up ? "pnl-up" : "pnl-down"}`} style={{ fontSize: 10, marginTop: 3 }}>{s.pct}</div>
              </div>
            </Link>
          ))}
          <div style={{ padding: 12 }}>
            <Link href="/dashboard/watchlist" className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              <Plus size={14} /> Add Stock
            </Link>
          </div>
        </div>

        {/* News */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span className="section-title" style={{ fontSize: 13 }}>Market News</span>
          </div>
          {NEWS.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 16px", borderBottom: i < NEWS.length - 1 ? "1px solid var(--border-subtle)" : "none", alignItems: "flex-start" }}>
              <div className={`dot ${n.sentiment === "bullish" ? "dot-success" : n.sentiment === "bearish" ? "dot-danger" : "dot-primary"}`} style={{ marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{n.headline}</div>
                <div style={{ fontSize: 10, color: "var(--text-disabled)" }}>{n.source} · {n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
