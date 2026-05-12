"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, BarChart2, Brain,
  BookOpen, Info, ArrowLeft, Star, Plus
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { formatINR, formatMarketCap, formatPct, getPnLColor } from "@/lib/utils";
import SwotGrid from "@/components/stock/swot-grid";
import FundamentalsTable from "@/components/stock/fundamentals-table";
import TechnicalChart from "@/components/charts/technical-chart";
import { PERIOD_MAP } from "@/components/charts/price-chart";

// Dynamically import chart (uses DOM APIs — SSR incompatible)
const PriceChart = dynamic(() => import("@/components/charts/price-chart"), { ssr: false });

type Tab = "overview" | "chart" | "technicals" | "analysis" | "fundamentals";
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "chart", label: "Chart", icon: BarChart2 },
  { id: "technicals", label: "Technicals", icon: TrendingUp },
  { id: "analysis", label: "AI Analysis", icon: Brain },
  { id: "fundamentals", label: "Fundamentals", icon: BookOpen },
];

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params?.symbol as string || "").toUpperCase();

  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState("1Y");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoadingProfile(true);
    api.stocks.getProfile(symbol)
      .then((data: any) => setProfile(data))
      .catch(() => setError("Failed to load stock data"))
      .finally(() => setLoadingProfile(false));
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;
    const { period: p, interval } = PERIOD_MAP[period] || { period: "1y", interval: "1d" };
    api.stocks.getHistory(symbol, p, interval)
      .then((data: any) => setHistory(data?.bars || []))
      .catch(() => {});
  }, [symbol, period]);

  const fetchAnalysis = async () => {
    if (analysis) { setTab("analysis"); return; }
    setLoadingAnalysis(true);
    setTab("analysis");
    try {
      const data: any = await api.ai.analyzeStock(symbol, "");
      setAnalysis(data?.analysis);
    } catch { setAnalysis({ error: "Analysis unavailable" }); }
    finally { setLoadingAnalysis(false); }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-500">Loading {symbol}...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500">{error || "Stock not found"}</p>
        <Link href="/dashboard" className="btn-ghost">← Back to Dashboard</Link>
      </div>
    );
  }

  const change = profile.change ?? (profile.price - profile.prev_close);
  const changePct = profile.change_pct ?? ((change / profile.prev_close) * 100);
  const isUp = changePct >= 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-300">{symbol[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{symbol.replace(".NS","").replace(".BO","")}</h1>
              <p className="text-sm text-slate-500">{profile.name}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-white">{formatINR(profile.price)}</div>
          <div className={`text-sm font-medium num ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({formatPct(changePct)})
          </div>
        </div>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Market Cap", value: formatMarketCap(profile.market_cap) },
          { label: "52W High", value: formatINR(profile.week_52_high) },
          { label: "52W Low", value: formatINR(profile.week_52_low) },
          { label: "Volume", value: profile.volume ? `${(profile.volume / 1e5).toFixed(2)}L` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4 gradient-border">
            <div className="stat-label">{label}</div>
            <div className="text-lg font-bold text-white num mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-white/5 pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => id === "analysis" ? fetchAnalysis() : setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === id
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="glass-card gradient-border p-6">
              <div className="text-sm font-semibold text-white mb-2">About {profile.name}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{profile.description || "No description available."}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.sector && <span className="badge badge-info">{profile.sector}</span>}
                {profile.industry && <span className="badge badge-neutral">{profile.industry}</span>}
                {profile.exchange && <span className="badge badge-neutral">{profile.exchange}</span>}
              </div>
            </div>
            {profile.fundamentals && <FundamentalsTable fundamentals={profile.fundamentals} />}
          </div>
        )}

        {tab === "chart" && (
          <div className="glass-card gradient-border p-5">
            <PriceChart
              data={history}
              symbol={symbol}
              period={period}
              onPeriodChange={setPeriod}
            />
          </div>
        )}

        {tab === "technicals" && (
          profile.technicals
            ? <TechnicalChart technicals={profile.technicals} currentPrice={profile.price} />
            : <p className="text-slate-500 text-sm">Technicals not available</p>
        )}

        {tab === "analysis" && (
          <div className="space-y-5">
            {loadingAnalysis ? (
              <div className="flex items-center gap-3 py-12 justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-slate-500">AI is analysing {symbol}...</span>
              </div>
            ) : analysis ? (
              <>
                {analysis.investment_thesis && (
                  <div className="glass-card gradient-border p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">Investment Thesis</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{analysis.investment_thesis}</p>
                  </div>
                )}
                {analysis.swot && <SwotGrid swot={analysis.swot} />}
                {analysis.bear_case && (
                  <div className="glass-card p-6 border border-red-500/10 bg-red-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-300">Bear Case / Risks</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{analysis.bear_case}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {analysis.valuation_view && (
                    <div className="glass-card p-4 border border-white/5 text-center">
                      <div className="stat-label">Valuation</div>
                      <div className="text-sm font-semibold text-white mt-1">{analysis.valuation_view}</div>
                    </div>
                  )}
                  {analysis.risk_rating && (
                    <div className="glass-card p-4 border border-white/5 text-center">
                      <div className="stat-label">Risk Rating</div>
                      <span className={`badge mt-1 ${analysis.risk_rating === "low" ? "badge-success" : analysis.risk_rating === "high" ? "badge-danger" : "badge-warning"}`}>
                        {analysis.risk_rating}
                      </span>
                    </div>
                  )}
                  {analysis.ai_sentiment_score !== undefined && (
                    <div className="glass-card p-4 border border-white/5 text-center">
                      <div className="stat-label">AI Score</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{analysis.ai_sentiment_score}<span className="text-sm text-slate-500">/100</span></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-700 border-t border-white/5 pt-3">{analysis.disclaimer}</p>
              </>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Click "AI Analysis" tab to generate analysis</p>
            )}
          </div>
        )}

        {tab === "fundamentals" && profile.fundamentals && (
          <FundamentalsTable fundamentals={profile.fundamentals} />
        )}
      </motion.div>
    </div>
  );
}
