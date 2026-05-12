"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GitCompare, Search, X, Plus, Minus } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatINR, formatPct, getPnLColor, debounce } from "@/lib/utils";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const MAX_STOCKS = 3;

type StockData = {
  symbol: string; name: string; price: number;
  change_pct: number; profile?: any; history?: any[];
};

function MetricRow({ label, values, format }: {
  label: string;
  values: (number | null | undefined)[];
  format?: (v: number) => string;
}) {
  const fmt = format || ((v: number) => v?.toFixed(2));
  const vals = values.map(v => v != null ? Number(v) : null);
  const max = Math.max(...vals.filter(v => v != null) as number[]);
  const min = Math.min(...vals.filter(v => v != null) as number[]);

  return (
    <div className="grid border-b border-white/5 hover:bg-white/3 transition-colors"
      style={{ gridTemplateColumns: `160px repeat(${values.length}, 1fr)` }}>
      <div className="px-4 py-3 text-xs text-slate-500">{label}</div>
      {values.map((v, i) => {
        const isBest = v === max && max !== min;
        const isWorst = v === min && max !== min;
        return (
          <div key={i} className={`px-4 py-3 text-sm font-mono text-right font-semibold ${
            isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white"
          }`}>
            {v != null ? fmt(v) : "—"}
          </div>
        );
      })}
    </div>
  );
}

export default function ComparePage() {
  const [selected, setSelected] = useState<StockData[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const doSearch = debounce(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const data: any = await api.stocks.search(q, 8).catch(() => ({ results: [] }));
    setSearchResults(data.results || []);
  }, 300);

  const addStock = async (sym: string, name: string) => {
    if (selected.length >= MAX_STOCKS || selected.find(s => s.symbol === sym)) return;
    setLoading(sym);
    setQuery(""); setSearchResults([]);
    try {
      const [profileData, historyData]: any[] = await Promise.all([
        api.stocks.getProfile(sym.replace(".NS","").replace(".BO","")),
        api.stocks.getHistory(sym.replace(".NS","").replace(".BO",""), "3mo", "1d"),
      ]);
      setSelected(prev => [...prev, {
        symbol: sym,
        name,
        price: profileData?.price || 0,
        change_pct: profileData?.change_pct || 0,
        profile: profileData,
        history: historyData?.bars || [],
      }]);
    } catch {}
    finally { setLoading(null); }
  };

  const removeStock = (sym: string) => setSelected(prev => prev.filter(s => s.symbol !== sym));

  // Build normalised chart data (rebased to 100 at start)
  const chartData = (() => {
    if (!selected.length) return [];
    const allDates = [...new Set(selected.flatMap(s => (s.history || []).map((h: any) => h.date)))].sort();
    return allDates.map(date => {
      const row: any = { date: date.slice(5) }; // MM-DD
      selected.forEach(s => {
        const bar = (s.history || []).find((h: any) => h.date === date);
        const first = (s.history || [])[0];
        if (bar && first) {
          row[s.symbol] = parseFloat(((bar.close / first.close) * 100).toFixed(2));
        }
      });
      return row;
    });
  })();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-indigo-400" /> Compare Stocks
        </h1>
        <p className="text-slate-500 text-sm mt-1">Side-by-side performance and fundamentals comparison (up to {MAX_STOCKS} stocks)</p>
      </div>

      {/* Search to add */}
      <div className="glass-card gradient-border p-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {selected.map((s, i) => (
            <div key={s.symbol} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold"
              style={{ borderColor: COLORS[i] + "60", background: COLORS[i] + "15", color: COLORS[i] }}>
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
              {s.symbol.replace(".NS","")}
              <button onClick={() => removeStock(s.symbol)} className="hover:opacity-70 transition-opacity ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selected.length === 0 && <span className="text-sm text-slate-600">Add stocks below to compare</span>}
        </div>
        {selected.length < MAX_STOCKS && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
              placeholder={`Search stock to add (${MAX_STOCKS - selected.length} remaining)...`}
              className="input-field pl-9" />
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="mt-2 border border-white/10 rounded-xl overflow-hidden">
            {searchResults.filter(r => !selected.find(s => s.symbol === r.symbol)).map(r => (
              <button key={r.symbol} onClick={() => addStock(r.symbol, r.name)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left">
                <div>
                  <div className="text-sm font-mono font-semibold text-white">{r.symbol.replace(".NS","")}</div>
                  <div className="text-xs text-slate-500">{r.name}</div>
                </div>
                {loading === r.symbol
                  ? <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  : <Plus className="w-4 h-4 text-indigo-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rebased performance chart */}
      {selected.length >= 2 && chartData.length > 0 && (
        <div className="glass-card gradient-border p-6">
          <div className="text-sm font-semibold text-white mb-4">Relative Performance (3M — Rebased to 100)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} interval={14} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
              {selected.map((s, i) => (
                <Line key={s.symbol} type="monotone" dataKey={s.symbol}
                  stroke={COLORS[i]} strokeWidth={2} dot={false}
                  name={s.symbol.replace(".NS","")} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Price summary cards */}
      {selected.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
          {selected.map((s, i) => (
            <div key={s.symbol} className="glass-card p-5 rounded-xl border"
              style={{ borderColor: COLORS[i] + "40" }}>
              <div className="text-xs font-mono font-bold mb-1" style={{ color: COLORS[i] }}>
                {s.symbol.replace(".NS","")}
              </div>
              <div className="text-xl font-bold text-white font-mono">{formatINR(s.price)}</div>
              <div className={`text-sm font-mono font-medium ${getPnLColor(s.change_pct)}`}>
                {s.change_pct >= 0 ? "+" : ""}{s.change_pct?.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fundamentals comparison table */}
      {selected.length >= 2 && (
        <div className="glass-card gradient-border overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <span className="text-sm font-semibold text-white">Fundamentals Comparison</span>
            <span className="text-xs text-slate-600 ml-2">(green = best, red = worst)</span>
          </div>
          <div className="overflow-x-auto">
            <div style={{ minWidth: 500 }}>
              {/* Header */}
              <div className="grid border-b border-white/10 bg-white/3"
                style={{ gridTemplateColumns: `160px repeat(${selected.length}, 1fr)` }}>
                <div className="px-4 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Metric</div>
                {selected.map((s, i) => (
                  <div key={s.symbol} className="px-4 py-3 text-xs font-bold text-right uppercase tracking-wider"
                    style={{ color: COLORS[i] }}>{s.symbol.replace(".NS","")}</div>
                ))}
              </div>
              <MetricRow label="P/E Ratio" values={selected.map(s => s.profile?.fundamentals?.pe_ratio)}
                format={(v) => `${v.toFixed(1)}x`} />
              <MetricRow label="P/B Ratio" values={selected.map(s => s.profile?.fundamentals?.pb_ratio)}
                format={(v) => `${v.toFixed(1)}x`} />
              <MetricRow label="ROE %" values={selected.map(s => s.profile?.fundamentals?.roe != null ? s.profile.fundamentals.roe * 100 : null)}
                format={(v) => `${v.toFixed(1)}%`} />
              <MetricRow label="Profit Margin" values={selected.map(s => s.profile?.fundamentals?.profit_margin != null ? s.profile.fundamentals.profit_margin * 100 : null)}
                format={(v) => `${v.toFixed(1)}%`} />
              <MetricRow label="Dividend Yield" values={selected.map(s => s.profile?.fundamentals?.dividend_yield != null ? s.profile.fundamentals.dividend_yield * 100 : null)}
                format={(v) => `${v.toFixed(2)}%`} />
              <MetricRow label="Debt/Equity" values={selected.map(s => s.profile?.fundamentals?.debt_to_equity)}
                format={(v) => `${v.toFixed(2)}x`} />
              <MetricRow label="Market Cap" values={selected.map(s => s.profile?.market_cap)}
                format={(v) => `₹${(v/1e9).toFixed(0)}B`} />
            </div>
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <div className="glass-card p-12 text-center">
          <GitCompare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Search and add 2–3 stocks above to compare them side by side.</p>
        </div>
      )}
    </div>
  );
}
