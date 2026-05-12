"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness, ArrowLeft, TrendingUp, TrendingDown,
  AlertTriangle, Printer, RefreshCw
} from "lucide-react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { formatINR, formatMarketCap, formatPct, getPnLColor } from "@/lib/utils";

const SECTOR_COLORS: Record<string, string> = {
  "Technology":          "#6366f1",
  "Financial Services":  "#3b82f6",
  "Healthcare":          "#10b981",
  "Energy":              "#f59e0b",
  "Consumer Goods":      "#8b5cf6",
  "Consumer Discretionary": "#06b6d4",
  "Industrials":         "#f97316",
  "Materials":           "#84cc16",
  "Utilities":           "#a78bfa",
  "Communication":       "#ec4899",
  "Other":               "#64748b",
};

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Low Risk",    color: "text-emerald-400", bg: "badge-success" },
  medium: { label: "Medium Risk", color: "text-amber-400",   bg: "badge-warning" },
  high:   { label: "High Risk",   color: "text-red-400",     bg: "badge-danger"  },
};

// Build sector allocation from holdings
function buildAllocation(holdings: any[]) {
  const map: Record<string, number> = {};
  holdings.forEach(h => {
    const sec = h.sector || "Other";
    map[sec] = (map[sec] || 0) + (h.allocation_pct || 0);
  });
  return Object.entries(map).map(([name, value]) => ({
    name, value: Math.round(value * 10) / 10,
    color: SECTOR_COLORS[name] || SECTOR_COLORS["Other"],
  }));
}

// Mock growth projection for the portfolio
function buildGrowth(amount: number, cagr: number) {
  return Array.from({ length: 6 }, (_, i) => ({
    year: `Y${i}`,
    value: Math.round(amount * Math.pow(1 + (cagr || 12) / 100, i)),
  }));
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 border border-white/10 text-xs rounded-xl">
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.color }}>{payload[0].value}%</p>
    </div>
  );
};

export default function PortfolioDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params?.id as string;
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !session) return;
    const token = (session as any)?.accessToken || "";
    api.portfolio.get(id, token)
      .then((data: any) => setPortfolio(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-500">Loading portfolio...</span>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500">Portfolio not found</p>
        <Link href="/dashboard/portfolio" className="btn-ghost">← Back</Link>
      </div>
    );
  }

  const holdings: any[] = portfolio.holdings || [];
  const allocationData = buildAllocation(holdings);
  const growthData = buildGrowth(portfolio.investment_amount || 100000, portfolio.expected_cagr || 12);
  const riskCfg = RISK_CONFIG[portfolio.risk_profile || "medium"];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/portfolio" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All Portfolios
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BriefcaseBusiness className="w-6 h-6 text-indigo-400" />
            {portfolio.name || "AI Portfolio"}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`badge ${riskCfg.bg}`}>{riskCfg.label}</span>
            <span className="badge badge-neutral">{portfolio.investment_horizon?.replace("_"," ") || "Long Term"}</span>
            <span className="badge badge-info">{holdings.length} Holdings</span>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="btn-ghost flex items-center gap-2 text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card gradient-border p-5">
          <div className="stat-label">Investment Amount</div>
          <div className="text-xl font-bold text-white font-mono mt-1">{formatMarketCap(portfolio.investment_amount)}</div>
        </div>
        <div className="glass-card gradient-border p-5">
          <div className="stat-label">Expected CAGR</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{portfolio.expected_cagr?.toFixed(1) || "—"}%</div>
        </div>
        <div className="glass-card gradient-border p-5">
          <div className="stat-label">SIP Amount</div>
          <div className="text-xl font-bold text-white font-mono mt-1">{portfolio.sip_amount ? formatINR(portfolio.sip_amount, 0) : "—"}</div>
        </div>
        <div className="glass-card gradient-border p-5">
          <div className="stat-label">Projected Corpus (5Y)</div>
          <div className="text-xl font-bold text-indigo-300 font-mono mt-1">{formatMarketCap(growthData[5]?.value)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation Donut */}
        <div className="glass-card gradient-border p-6">
          <div className="text-sm font-semibold text-white mb-4">Sector Allocation</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={allocationData} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                dataKey="value" paddingAngle={2}>
                {allocationData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Projection */}
        <div className="glass-card gradient-border p-6">
          <div className="text-sm font-semibold text-white mb-4">Projected Growth</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v/1e5).toFixed(0)}L`} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [formatINR(v, 0), "Portfolio Value"]}
                contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#pgGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary */}
      {portfolio.ai_summary && (
        <div className="glass-card gradient-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">AI Portfolio Summary</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{portfolio.ai_summary}</p>
        </div>
      )}

      {/* Holdings */}
      <div className="glass-card gradient-border overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <span className="text-sm font-semibold text-white">Holdings Breakdown</span>
        </div>
        <div className="divide-y divide-white/5">
          {holdings.map((holding: any, i: number) => {
            const riskCfgH = RISK_CONFIG[holding.risk_level || "medium"];
            const cleanSym = (holding.symbol || "").replace(".NS","").replace(".BO","");
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-5 py-5 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-400">{cleanSym[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/stocks/${cleanSym}`}
                          className="text-sm font-bold text-white hover:text-indigo-300 transition-colors font-mono">
                          {cleanSym}
                        </Link>
                        <span className={`badge text-xs ${riskCfgH.bg}`}>{riskCfgH.label}</span>
                        {holding.sector && <span className="badge badge-neutral text-xs">{holding.sector}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{holding.name}</div>
                      {holding.reasoning && (
                        <p className="text-xs text-slate-500 mt-2 max-w-lg leading-relaxed">{holding.reasoning}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold text-white font-mono">{holding.allocation_pct}%</div>
                    <div className="text-xs text-slate-500">
                      {formatINR((portfolio.investment_amount || 0) * (holding.allocation_pct / 100), 0)}
                    </div>
                    {holding.expected_cagr && (
                      <div className="text-xs text-emerald-400 font-mono">~{holding.expected_cagr}% CAGR</div>
                    )}
                  </div>
                </div>

                {/* Allocation bar */}
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${holding.allocation_pct}%` }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-700 border-t border-white/5 pt-4">
        ⚠️ This AI-generated portfolio is for educational purposes only. Not SEBI-registered investment advice.
        Past performance is not indicative of future results. Consult a SEBI-registered adviser before investing.
      </p>
    </div>
  );
}
