"use client";
import { useState } from "react";
import Link from "next/link";
import { Filter, Download, Save, ChevronUp, ChevronDown, SlidersHorizontal } from "lucide-react";

const STOCKS = [
  { sym: "TCS",        sector: "Technology",         price: "3,924", chg: "+1.20%", up: true,  pe: 28.4, roe: 47.2, cap: "14.3L Cr", div: 1.8, rsi: 64, sig: "BUY" },
  { sym: "INFY",       sector: "Technology",         price: "1,634", chg: "+0.82%", up: true,  pe: 24.1, roe: 31.8, cap: "6.8L Cr",  div: 2.4, rsi: 58, sig: "BUY" },
  { sym: "HDFC Bank",  sector: "Financial Services", price: "1,742", chg: "+0.64%", up: true,  pe: 18.2, roe: 18.4, cap: "13.2L Cr", div: 1.2, rsi: 52, sig: "HOLD" },
  { sym: "Asian Paints",sector: "Consumer",          price: "2,842", chg: "-0.42%", up: false, pe: 54.2, roe: 29.1, cap: "2.7L Cr",  div: 0.9, rsi: 44, sig: "HOLD" },
  { sym: "Sun Pharma", sector: "Healthcare",         price: "1,248", chg: "+2.12%", up: true,  pe: 35.8, roe: 17.4, cap: "3.0L Cr",  div: 0.7, rsi: 71, sig: "BUY" },
  { sym: "Titan Co.",  sector: "Consumer",           price: "3,456", chg: "+1.84%", up: true,  pe: 87.2, roe: 28.3, cap: "3.1L Cr",  div: 0.3, rsi: 68, sig: "BUY" },
  { sym: "Wipro",      sector: "Technology",         price: "498",   chg: "-1.22%", up: false, pe: 21.4, roe: 16.2, cap: "2.7L Cr",  div: 1.8, rsi: 38, sig: "SELL" },
  { sym: "ICICI Bank", sector: "Financial Services", price: "1,098", chg: "+0.92%", up: true,  pe: 17.8, roe: 18.9, cap: "7.7L Cr",  div: 0.8, rsi: 55, sig: "BUY" },
];

const SIG_STYLE: Record<string, { bg: string; color: string }> = {
  BUY:  { bg: "var(--success-muted)", color: "var(--success)" },
  HOLD: { bg: "var(--warning-muted)", color: "var(--warning)" },
  SELL: { bg: "var(--danger-muted)",  color: "var(--danger)" },
};

type SortKey = "sym" | "price" | "pe" | "roe" | "rsi";

export default function ScreenerPage() {
  const [sortKey, setSortKey] = useState<SortKey>("roe");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [sectorFilter, setSectorFilter] = useState<string[]>(["Technology","Financial Services","Healthcare","Consumer"]);

  const sort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const rows = [...STOCKS]
    .filter(s => sectorFilter.includes(s.sector))
    .sort((a, b) => {
      const av = sortKey === "sym" ? a.sym : sortKey === "price" ? parseFloat(a.price.replace(",","")) : a[sortKey];
      const bv = sortKey === "sym" ? b.sym : sortKey === "price" ? parseFloat(b.price.replace(",","")) : b[sortKey];
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const toggleSector = (s: string) => setSectorFilter(f => f.includes(s) ? f.filter(x => x !== s) : [...f, s]);

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span style={{ marginLeft: 4, opacity: sortKey === k ? 1 : 0.3 }}>
      {sortKey === k && sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
    </span>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "256px 1fr", gap: 20, alignItems: "start" }}>

      {/* ── Filter Sidebar ───────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden", position: "sticky", top: 80 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--primary-dim)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Filters</span>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Market Cap */}
          <div>
            <div className="label-md" style={{ marginBottom: 10 }}>Market Cap</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Large Cap", "Mid Cap", "Small Cap"].map((c, i) => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
                  <input type="checkbox" defaultChecked={i < 2} style={{ accentColor: "#4F46E5" }} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          {/* Fundamentals */}
          <div>
            <div className="label-md" style={{ marginBottom: 10 }}>Fundamentals</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
                  <span>P/E Ratio</span><span style={{ color: "var(--primary-dim)", fontFamily: "JetBrains Mono" }}>Max 50</span>
                </div>
                <input type="range" min={0} max={100} defaultValue={50} style={{ width: "100%", accentColor: "#4F46E5" }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
                  <span>ROE %</span><span style={{ color: "var(--primary-dim)", fontFamily: "JetBrains Mono" }}>Min 15%</span>
                </div>
                <input type="range" min={0} max={50} defaultValue={15} style={{ width: "100%", accentColor: "#4F46E5" }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
                  <span>Debt/Equity</span><span style={{ color: "var(--primary-dim)", fontFamily: "JetBrains Mono" }}>Max 1.5x</span>
                </div>
                <input type="range" min={0} max={5} step={0.1} defaultValue={1.5} style={{ width: "100%", accentColor: "#4F46E5" }} />
              </div>
            </div>
          </div>

          {/* Technical */}
          <div>
            <div className="label-md" style={{ marginBottom: 10 }}>Technical</div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
                <span>RSI Range</span><span style={{ color: "var(--primary-dim)", fontFamily: "JetBrains Mono" }}>30 – 70</span>
              </div>
              <input type="range" min={0} max={100} defaultValue={70} style={{ width: "100%", accentColor: "#4F46E5" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginTop: 10, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "#4F46E5" }} />
              Above MA200
            </label>
          </div>

          {/* Sector */}
          <div>
            <div className="label-md" style={{ marginBottom: 10 }}>Sector</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Technology","Financial Services","Healthcare","Consumer","Energy","Metals"].map(s => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={sectorFilter.includes(s)} onChange={() => toggleSector(s)} style={{ accentColor: "#4F46E5" }} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Apply Filters
          </button>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>
            Reset All
          </button>
        </div>
      </div>

      {/* ── Table Panel ──────────────────────────────────────────── */}
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
              <Filter size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 8, color: "var(--primary-dim)" }} />
              Stock Screener
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Screen 5,000+ NSE & BSE stocks with 50+ filters</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="badge badge-primary">{rows.length} stocks match</div>
            <button className="btn btn-ghost btn-sm"><Save size={13} /> Save</button>
            <button className="btn btn-ghost btn-sm"><Download size={13} /> Export CSV</button>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th onClick={() => sort("sym")} style={{ cursor: "pointer" }}>Company <SortIcon k="sym" /></th>
                  <th>Sector</th>
                  <th className="right" onClick={() => sort("price")} style={{ cursor: "pointer" }}>Price <SortIcon k="price" /></th>
                  <th className="right">Change</th>
                  <th className="right" onClick={() => sort("pe")} style={{ cursor: "pointer" }}>P/E <SortIcon k="pe" /></th>
                  <th className="right" onClick={() => sort("roe")} style={{ cursor: "pointer" }}>ROE% <SortIcon k="roe" /></th>
                  <th className="right">Mkt Cap</th>
                  <th className="right">Div%</th>
                  <th className="right" onClick={() => sort("rsi")} style={{ cursor: "pointer" }}>RSI <SortIcon k="rsi" /></th>
                  <th className="right">Signal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const ss = SIG_STYLE[s.sig];
                  return (
                    <tr key={s.sym}>
                      <td style={{ color: "var(--text-disabled)", fontSize: 11 }}>{i + 1}</td>
                      <td>
                        <Link href={`/dashboard/stocks/${s.sym.replace(" ","")}`}
                          style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textDecoration: "none" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--primary-dim)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-primary)")}>
                          {s.sym}
                        </Link>
                      </td>
                      <td><span className="badge badge-neutral">{s.sector}</span></td>
                      <td className="right mono">₹{s.price}</td>
                      <td className="right">
                        <span className={`pnl-badge ${s.up ? "pnl-up" : "pnl-down"}`}>{s.chg}</span>
                      </td>
                      <td className="right mono">{s.pe}x</td>
                      <td className="right mono" style={{ color: s.roe > 25 ? "var(--success)" : "var(--text-primary)" }}>{s.roe}%</td>
                      <td className="right mono">{s.cap}</td>
                      <td className="right mono">{s.div}%</td>
                      <td className="right mono" style={{ color: s.rsi > 65 ? "var(--warning)" : s.rsi < 40 ? "var(--danger)" : "var(--text-primary)" }}>{s.rsi}</td>
                      <td className="right">
                        <span className="badge" style={{ background: ss.bg, color: ss.color }}>{s.sig}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Showing 1–{rows.length} of {rows.length} results</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" disabled>Previous</button>
              <button className="btn btn-ghost btn-sm" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
