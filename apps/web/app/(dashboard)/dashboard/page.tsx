"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Brain, Activity,
  BarChart3, ArrowRight, Zap, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { formatINR, formatPct, getPnLColor } from "@/lib/utils";

const WATCHLIST_DEMO = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2847.45, change: 1.24 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3912.20, change: 0.87 },
  { symbol: "INFY", name: "Infosys", price: 1487.60, change: 2.15 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1621.35, change: -0.34 },
];

const MARKET_NEWS = [
  { time: "10 min ago", headline: "Nifty 50 hits fresh high; IT stocks lead rally", sentiment: "bullish" },
  { time: "25 min ago", headline: "RBI keeps repo rate unchanged; markets cheer stability", sentiment: "bullish" },
  { time: "1 hr ago", headline: "FII net buyers at ₹3,245 Cr; DII sell ₹892 Cr", sentiment: "neutral" },
  { time: "2 hr ago", headline: "Pharma index underperforms; export concerns weigh", sentiment: "bearish" },
];

function IndexCard({ name, value, change, change_pct }: {
  name: string; value: number; change: number; change_pct: number;
}) {
  const up = change_pct >= 0;
  return (
    <div className="stat-card gradient-border">
      <div className="flex items-start justify-between">
        <div className="stat-label">{name}</div>
        {up ? (
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="stat-value num">{value.toLocaleString("en-IN")}</div>
      <div className={`stat-change num ${up ? "text-emerald-400" : "text-red-400"}`}>
        {up ? "+" : ""}{change.toFixed(2)} ({formatPct(change_pct)})
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [indices, setIndices] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    api.market.indices().then((data: any) => setIndices(data.indices)).catch(() => {});
  }, []);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    try {
      const data: any = await api.ai.marketInsight();
      setAiInsight(data.insight);
    } catch { setAiInsight("Unable to fetch AI insight. Please try again."); }
    finally { setLoadingInsight(false); }
  };

  const INDICES_DISPLAY = [
    { key: "^NSEI", name: "Nifty 50", value: 24502, change: 127.4, change_pct: 0.52 },
    { key: "^BSESN", name: "Sensex", value: 80521, change: 421.3, change_pct: 0.53 },
    { key: "^CNXBANK", name: "Bank Nifty", value: 53124, change: -89.5, change_pct: -0.17 },
    { key: "^CNXIT", name: "Nifty IT", value: 37842, change: 312.1, change_pct: 0.83 },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Market Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tuesday, {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          <span className="text-emerald-400 font-medium">● NSE Market Open</span>
        </p>
      </div>

      {/* ── Market Indices ────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {INDICES_DISPLAY.map((idx, i) => (
            <motion.div key={idx.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <IndexCard name={idx.name} value={idx.value} change={idx.change} change_pct={idx.change_pct} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Watchlist ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass-card gradient-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="section-title">Your Watchlist</div>
              <div className="section-subtitle">Tracking 4 stocks</div>
            </div>
            <Link href="/dashboard/watchlist" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {WATCHLIST_DEMO.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/dashboard/stocks/${stock.symbol}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-300">{stock.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{stock.symbol}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[180px]">{stock.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">₹{stock.price.toLocaleString("en-IN")}</div>
                  <div className={`text-xs num font-medium ${getPnLColor(stock.change)}`}>
                    {formatPct(stock.change)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── AI Insight Panel ──────────────────────────────────────────── */}
        <div className="glass-card gradient-border p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI Market Insight</div>
              <div className="text-xs text-slate-500">GPT-4o powered</div>
            </div>
          </div>

          {aiInsight ? (
            <div className="flex-1 text-sm text-slate-400 leading-relaxed overflow-y-auto max-h-48">
              {aiInsight}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Zap className="w-10 h-10 text-indigo-500/50" />
              <p className="text-xs text-slate-500 text-center">
                Get an AI-generated analysis of current market conditions
              </p>
              <button
                onClick={fetchInsight}
                disabled={loadingInsight}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
              >
                {loadingInsight ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Brain className="w-3 h-3" />}
                {loadingInsight ? "Generating..." : "Generate Insight"}
              </button>
            </div>
          )}
          <p className="text-xs text-slate-700 mt-4 border-t border-white/5 pt-3">
            ⚠️ Educational only — not investment advice
          </p>
        </div>
      </div>

      {/* ── Market News ──────────────────────────────────────────────────── */}
      <div className="glass-card gradient-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="section-title">Market News</div>
          <Link href="/dashboard/news" className="btn-ghost text-xs flex items-center gap-1">
            All news <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {MARKET_NEWS.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                item.sentiment === "bullish" ? "bg-emerald-400" :
                item.sentiment === "bearish" ? "bg-red-400" : "bg-amber-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 leading-snug">{item.headline}</p>
                <p className="text-xs text-slate-600 mt-1">{item.time}</p>
              </div>
              <span className={`badge flex-shrink-0 text-xs ${
                item.sentiment === "bullish" ? "badge-success" :
                item.sentiment === "bearish" ? "badge-danger" : "badge-warning"
              }`}>
                {item.sentiment}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/portfolio" className="glass-card gradient-border p-5 group hover:shadow-glow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm font-semibold text-white mb-1">Build AI Portfolio</div>
          <div className="text-xs text-slate-500">Get a personalized stock portfolio in seconds</div>
        </Link>
        <Link href="/dashboard/screener" className="glass-card gradient-border p-5 group hover:shadow-glow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm font-semibold text-white mb-1">Stock Screener</div>
          <div className="text-xs text-slate-500">Filter by PE, ROE, sector, and 20+ parameters</div>
        </Link>
        <Link href="/dashboard/insights" className="glass-card gradient-border p-5 group hover:shadow-glow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm font-semibold text-white mb-1">AI Stock Analysis</div>
          <div className="text-xs text-slate-500">SWOT, earnings trends, and investment thesis</div>
        </Link>
      </div>
    </div>
  );
}
