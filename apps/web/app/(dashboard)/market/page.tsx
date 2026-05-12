"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, BarChart3, Activity,
  RefreshCw, Flame, Snowflake
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatINR, formatPct, getPnLColor, formatMarketCap } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ── Sector data (client-side, uses NSE sector knowledge) ─────────────────────
const SECTOR_PERF: { name: string; change: number; color: string }[] = [
  { name: "IT",          change:  2.3, color: "#6366f1" },
  { name: "Banking",     change: -0.8, color: "#3b82f6" },
  { name: "Pharma",      change:  1.4, color: "#10b981" },
  { name: "Auto",        change:  0.6, color: "#f59e0b" },
  { name: "FMCG",        change: -0.3, color: "#8b5cf6" },
  { name: "Energy",      change: -1.2, color: "#ef4444" },
  { name: "Metals",      change:  3.1, color: "#06b6d4" },
  { name: "Realty",      change:  1.8, color: "#84cc16" },
  { name: "Infra",       change: -0.5, color: "#f97316" },
  { name: "Healthcare",  change:  0.9, color: "#a78bfa" },
];

function SectorHeatmap({ sectors }: { sectors: typeof SECTOR_PERF }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {sectors.map((s) => {
        const isUp = s.change >= 0;
        const intensity = Math.min(Math.abs(s.change) / 4, 1);
        return (
          <div
            key={s.name}
            className="relative rounded-xl p-3 border transition-transform hover:scale-105 cursor-default"
            style={{
              background: isUp
                ? `rgba(16, 185, 129, ${0.05 + intensity * 0.2})`
                : `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`,
              borderColor: isUp
                ? `rgba(16, 185, 129, ${0.1 + intensity * 0.3})`
                : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`,
            }}
          >
            <div className="text-xs font-semibold text-white">{s.name}</div>
            <div className={`text-sm font-bold font-mono mt-1 ${getPnLColor(s.change)}`}>
              {isUp ? "+" : ""}{s.change}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

type StockMover = { symbol: string; name: string; price: number; change: number; change_pct: number };

function MoversTable({ stocks, type }: { stocks: StockMover[]; type: "gainers" | "losers" }) {
  if (!stocks.length) {
    return <div className="py-6 text-center text-xs text-slate-600">Loading market data...</div>;
  }
  return (
    <div className="divide-y divide-white/5">
      {stocks.map((s, i) => {
        const clean = s.symbol.replace(".NS","").replace(".BO","");
        return (
          <motion.div key={s.symbol}
            initial={{ opacity: 0, x: type === "gainers" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors"
          >
            <Link href={`/dashboard/stocks/${clean}`} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{clean}</div>
                <div className="text-xs text-slate-600 truncate max-w-[160px]">{s.name}</div>
              </div>
            </Link>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-white">{formatINR(s.price)}</div>
              <div className={`text-xs font-mono font-medium ${getPnLColor(s.change_pct)}`}>
                {type === "gainers" ? "+" : ""}{s.change_pct?.toFixed(2)}%
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function MarketPage() {
  const [indices, setIndices] = useState<any>({});
  const [gainers, setGainers] = useState<StockMover[]>([]);
  const [losers,  setLosers]  = useState<StockMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMarket = async () => {
    try {
      const data: any = await api.market.indices();
      setIndices(data);

      // Mock gainers/losers from index data + known stocks
      // In production these come from the /market/movers endpoint
      const allStocks = [
        { symbol: "METALS.NS",     name: "Metals Sector",    price: 7840,  change: 231,  change_pct: 3.04 },
        { symbol: "TATASTEEL.NS",  name: "Tata Steel Ltd",   price: 162,   change: 4.8,  change_pct: 3.05 },
        { symbol: "HINDALCO.NS",   name: "Hindalco Ind.",     price: 638,   change: 17.2, change_pct: 2.77 },
        { symbol: "ADANIENT.NS",   name: "Adani Enterprises", price: 2418,  change: 58.4, change_pct: 2.48 },
        { symbol: "TECHM.NS",      name: "Tech Mahindra",     price: 1376,  change: 31.2, change_pct: 2.32 },
      ];
      const allLosers = [
        { symbol: "ONGC.NS",       name: "ONGC Ltd",          price: 238,   change: -6.2, change_pct: -2.54 },
        { symbol: "BHARTIARTL.NS", name: "Bharti Airtel",     price: 1648,  change: -38.4,change_pct: -2.28 },
        { symbol: "SBIN.NS",       name: "State Bank India",  price: 789,   change: -16.8,change_pct: -2.09 },
        { symbol: "ITC.NS",        name: "ITC Ltd",           price: 437,   change: -7.6, change_pct: -1.71 },
        { symbol: "BAJFINANCE.NS", name: "Bajaj Finance",     price: 6840,  change: -112.4,change_pct: -1.62 },
      ];
      setGainers(allStocks);
      setLosers(allLosers);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadMarket(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadMarket();
    setRefreshing(false);
  };

  const indexList = Object.entries(indices).map(([k, v]: any) => ({ key: k, ...v }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" /> Market Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">Indian market indices, sector heatmap, and today's movers</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Index Cards */}
      {indexList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {indexList.map((idx) => {
            const isUp = (idx.change_pct || 0) >= 0;
            return (
              <div key={idx.key} className="glass-card gradient-border p-4">
                <div className="text-xs text-slate-500 truncate">{idx.name || idx.key}</div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  {idx.price ? idx.price.toLocaleString("en-IN") : "—"}
                </div>
                <div className={`text-xs font-mono font-medium mt-0.5 ${getPnLColor(idx.change_pct)}`}>
                  {isUp ? "+" : ""}{(idx.change_pct || 0).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sector Heatmap */}
      <div className="glass-card gradient-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Sector Performance (Today)
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/60" /> Gaining</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/60" /> Falling</span>
          </div>
        </div>
        <SectorHeatmap sectors={SECTOR_PERF} />
      </div>

      {/* Gainers & Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card gradient-border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Top Gainers</span>
            <span className="badge badge-success ml-auto text-xs">Today</span>
          </div>
          <MoversTable stocks={gainers} type="gainers" />
        </div>

        <div className="glass-card gradient-border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
            <Snowflake className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">Top Losers</span>
            <span className="badge badge-danger ml-auto text-xs">Today</span>
          </div>
          <MoversTable stocks={losers} type="losers" />
        </div>
      </div>
    </div>
  );
}
