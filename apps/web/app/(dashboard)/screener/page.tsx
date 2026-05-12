"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, ChevronDown, TrendingUp, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const SECTORS = ["Technology", "Financial Services", "Healthcare", "Energy", "Consumer Goods", "Consumer Discretionary", "Industrials", "Materials", "Utilities", "Communication"];
const SORT_OPTIONS = [
  { value: "roe", label: "ROE %" },
  { value: "pe", label: "P/E Ratio" },
  { value: "div_yield", label: "Div Yield %" },
  { value: "revenue_growth", label: "Revenue Growth" },
];

type StockRow = {
  symbol: string; name: string; sector: string;
  pe: number; pb: number; roe: number;
  div_yield: number; market_cap: string; beta: number;
  revenue_growth: number;
};

function Badge({ val, low, high, reverse = false, suffix = "" }: {
  val: number; low: number; high: number; reverse?: boolean; suffix?: string
}) {
  const good = reverse ? val < low : val > high;
  const bad = reverse ? val > high : val < low;
  const cls = good ? "text-emerald-400" : bad ? "text-red-400" : "text-amber-400";
  return <span className={`font-mono text-sm font-semibold ${cls}`}>{val?.toFixed(1)}{suffix}</span>;
}

export default function ScreenerPage() {
  const [results, setResults] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sectors: [] as string[],
    maxPe: "",
    minRoe: "",
    minDivYield: "",
    sortBy: "roe",
    sortOrder: "desc",
  });

  const fetchResults = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.sectors.length) params.set("sectors", filters.sectors.join(","));
    if (filters.maxPe) params.set("max_pe", filters.maxPe);
    if (filters.minRoe) params.set("min_roe", filters.minRoe);
    if (filters.minDivYield) params.set("min_div_yield", filters.minDivYield);
    params.set("sort_by", filters.sortBy);
    params.set("sort_order", filters.sortOrder);
    params.set("limit", "50");
    try {
      const data: any = await api.screener.screen(params.toString());
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResults(); }, []);

  const toggleSector = (s: string) => {
    setFilters((f) => ({
      ...f,
      sectors: f.sectors.includes(s) ? f.sectors.filter((x) => x !== s) : [...f.sectors, s],
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-indigo-400" /> Stock Screener
          </h1>
          <p className="text-slate-500 text-sm mt-1">{results.length} stocks match your filters</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
              showFilters ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "border-white/10 text-slate-400 hover:text-white"
            }`}>
            <Filter className="w-4 h-4" /> Filters {filters.sectors.length > 0 && `(${filters.sectors.length})`}
          </button>
          <button onClick={fetchResults} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <RefreshCw className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card gradient-border p-6 space-y-5">
          {/* Sectors */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sectors</div>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <button key={s} onClick={() => toggleSector(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters.sectors.includes(s)
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                      : "border-white/10 text-slate-500 hover:text-slate-300"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          {/* Numeric Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Max P/E", key: "maxPe", placeholder: "e.g. 30" },
              { label: "Min ROE %", key: "minRoe", placeholder: "e.g. 15" },
              { label: "Min Div Yield %", key: "minDivYield", placeholder: "e.g. 2" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-slate-500 block mb-1">{label}</label>
                <input type="number" placeholder={placeholder}
                  value={(filters as any)[key]}
                  onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                  className="input-field text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Sort By</label>
              <select value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                className="input-field text-sm">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="glass-card gradient-border overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                {["Stock", "Sector", "P/E", "P/B", "ROE %", "Div Yield %", "Rev Growth %", "Beta", ""].map((h) => (
                  <th key={h} className={`py-3 px-4 font-medium ${h === "Stock" || h === "Sector" ? "text-left" : "text-right"} ${h === "" ? "" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.map((row, i) => {
                const clean = row.symbol.replace(".NS","").replace(".BO","");
                return (
                  <motion.tr key={row.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/stocks/${clean}`} className="flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">{clean[0]}</div>
                        <span className="text-sm font-semibold text-white">{clean}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><span className="badge badge-neutral text-xs">{row.sector}</span></td>
                    <td className="px-4 py-3 text-right"><Badge val={row.pe} low={10} high={30} reverse /></td>
                    <td className="px-4 py-3 text-right"><span className="text-sm font-mono text-slate-400">{row.pb?.toFixed(1)}x</span></td>
                    <td className="px-4 py-3 text-right"><Badge val={row.roe} low={12} high={20} suffix="%" /></td>
                    <td className="px-4 py-3 text-right"><Badge val={row.div_yield} low={1} high={3} suffix="%" /></td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-mono font-semibold ${row.revenue_growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {row.revenue_growth >= 0 ? "+" : ""}{row.revenue_growth?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right"><span className="text-sm font-mono text-slate-400">{row.beta?.toFixed(2)}</span></td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/stocks/${clean}`}
                        className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-300 transition-all p-1 rounded flex items-center">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No stocks match your filters. Try relaxing the criteria.</div>
          )}
        </div>
      )}
    </div>
  );
}
