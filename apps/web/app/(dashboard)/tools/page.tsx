"use client";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calculator, TrendingUp, Target, Percent,
  IndianRupee, Calendar, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";
import { formatINR, formatMarketCap } from "@/lib/utils";

// ── SIP Formula: FV = P × {[(1 + r)^n − 1] / r} × (1 + r) ──────────────────
function calcSIP(monthly: number, rateAnnual: number, years: number) {
  const r = rateAnnual / 100 / 12;
  const n = years * 12;
  if (r === 0) return { corpus: monthly * n, invested: monthly * n, interest: 0, data: [] };
  const corpus = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  const interest = corpus - invested;

  // Build month-by-month growth data (yearly points)
  const data = [];
  for (let y = 1; y <= years; y++) {
    const m = y * 12;
    const val = monthly * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
    data.push({ year: `Y${y}`, corpus: Math.round(val), invested: monthly * m });
  }
  return { corpus, invested, interest, data };
}

function calcLumpsum(principal: number, rateAnnual: number, years: number) {
  const corpus = principal * Math.pow(1 + rateAnnual / 100, years);
  const interest = corpus - principal;
  const data = Array.from({ length: years }, (_, i) => ({
    year: `Y${i + 1}`,
    corpus: Math.round(principal * Math.pow(1 + rateAnnual / 100, i + 1)),
    invested: principal,
  }));
  return { corpus, invested: principal, interest, data };
}

function calcGoal(target: number, rateAnnual: number, years: number) {
  const r = rateAnnual / 100 / 12;
  const n = years * 12;
  if (r === 0) return target / n;
  return (target * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));
}

function calcCAGR(buy: number, sell: number, years: number) {
  if (buy <= 0 || years <= 0) return 0;
  return (Math.pow(sell / buy, 1 / years) - 1) * 100;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-white/10 text-xs space-y-1 rounded-xl">
      <p className="text-slate-400 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "corpus" ? "Corpus" : "Invested"}: {formatINR(p.value, 0)}
        </p>
      ))}
    </div>
  );
};

// ── Stat Box ─────────────────────────────────────────────────────────────────
function StatBox({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="glass-card p-4 border border-white/5 space-y-1">
      <div className="stat-label">{label}</div>
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  );
}

type CalcTab = "sip" | "lumpsum" | "goal" | "cagr";
const TABS: { id: CalcTab; label: string; icon: any }[] = [
  { id: "sip",     label: "SIP Calculator",    icon: TrendingUp },
  { id: "lumpsum", label: "Lumpsum",            icon: IndianRupee },
  { id: "goal",    label: "Goal Planner",       icon: Target },
  { id: "cagr",    label: "CAGR Calculator",    icon: Percent },
];

export default function ToolsPage() {
  const [tab, setTab] = useState<CalcTab>("sip");

  // SIP state
  const [sip, setSip] = useState({ monthly: 10000, rate: 12, years: 10 });
  // Lumpsum state
  const [ls, setLs] = useState({ principal: 100000, rate: 12, years: 10 });
  // Goal state
  const [goal, setGoal] = useState({ target: 5000000, rate: 12, years: 15 });
  // CAGR state
  const [cagr, setCagr] = useState({ buy: 100, sell: 250, years: 5 });

  const sipResult  = calcSIP(sip.monthly, sip.rate, sip.years);
  const lsResult   = calcLumpsum(ls.principal, ls.rate, ls.years);
  const goalSIP    = calcGoal(goal.target, goal.rate, goal.years);
  const cagrResult = calcCAGR(cagr.buy, cagr.sell, cagr.years);

  const Slider = ({ label, value, min, max, step = 1, unit = "", onChange }: any) => (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-white font-semibold">{unit === "₹" ? formatINR(value, 0) : `${value.toLocaleString()}${unit}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500 h-1.5 rounded-full cursor-pointer" />
      <div className="flex justify-between text-xs text-slate-700 mt-0.5">
        <span>{unit === "₹" ? formatINR(min, 0) : `${min}${unit}`}</span>
        <span>{unit === "₹" ? formatINR(max, 0) : `${max}${unit}`}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-400" /> Financial Tools
        </h1>
        <p className="text-slate-500 text-sm mt-1">SIP projections, goal planning, and return calculators</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 border-b border-white/5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === id ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* ── SIP ─────────────────────────────────────────────────────────── */}
        {tab === "sip" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card gradient-border p-6 space-y-5">
              <div className="text-sm font-semibold text-white">SIP Parameters</div>
              <Slider label="Monthly SIP Amount" value={sip.monthly} min={500} max={200000} step={500} unit="₹"
                onChange={(v: number) => setSip(p => ({ ...p, monthly: v }))} />
              <Slider label="Expected Annual Return" value={sip.rate} min={4} max={30} step={0.5} unit="%"
                onChange={(v: number) => setSip(p => ({ ...p, rate: v }))} />
              <Slider label="Investment Period" value={sip.years} min={1} max={40} unit=" yrs"
                onChange={(v: number) => setSip(p => ({ ...p, years: v }))} />

              <div className="grid grid-cols-3 gap-3 pt-2">
                <StatBox label="Invested" value={formatINR(sipResult.invested, 0)} color="text-slate-300" />
                <StatBox label="Est. Returns" value={formatINR(sipResult.interest, 0)} color="text-emerald-400" />
                <StatBox label="Total Corpus" value={formatMarketCap(sipResult.corpus)} color="text-indigo-300" />
              </div>
            </div>

            <div className="glass-card gradient-border p-6">
              <div className="text-sm font-semibold text-white mb-4">Growth Projection</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={sipResult.data}>
                  <defs>
                    <linearGradient id="sipCorpus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sipInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                  <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v/1e5).toFixed(0)}L`} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="invested" stroke="#10b981" strokeWidth={2} fill="url(#sipInvested)" name="invested" />
                  <Area type="monotone" dataKey="corpus" stroke="#6366f1" strokeWidth={2} fill="url(#sipCorpus)" name="corpus" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-700 mt-2 text-center">
                💡 Results are indicative. Actual returns may vary based on market conditions.
              </p>
            </div>
          </div>
        )}

        {/* ── Lumpsum ──────────────────────────────────────────────────────── */}
        {tab === "lumpsum" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card gradient-border p-6 space-y-5">
              <div className="text-sm font-semibold text-white">Lumpsum Parameters</div>
              <Slider label="Investment Amount" value={ls.principal} min={10000} max={10000000} step={10000} unit="₹"
                onChange={(v: number) => setLs(p => ({ ...p, principal: v }))} />
              <Slider label="Expected Annual Return" value={ls.rate} min={4} max={30} step={0.5} unit="%"
                onChange={(v: number) => setLs(p => ({ ...p, rate: v }))} />
              <Slider label="Investment Period" value={ls.years} min={1} max={40} unit=" yrs"
                onChange={(v: number) => setLs(p => ({ ...p, years: v }))} />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <StatBox label="Invested" value={formatINR(lsResult.invested, 0)} color="text-slate-300" />
                <StatBox label="Est. Returns" value={formatINR(lsResult.interest, 0)} color="text-emerald-400" />
                <StatBox label="Total Corpus" value={formatMarketCap(lsResult.corpus)} color="text-indigo-300" />
              </div>
            </div>
            <div className="glass-card gradient-border p-6">
              <div className="text-sm font-semibold text-white mb-4">Wealth Growth</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={lsResult.data}>
                  <defs>
                    <linearGradient id="lsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                  <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v/1e5).toFixed(0)}L`} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="invested" stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="4 4" name="invested" />
                  <Area type="monotone" dataKey="corpus" stroke="#6366f1" strokeWidth={2} fill="url(#lsGrad)" name="corpus" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Goal Planner ─────────────────────────────────────────────────── */}
        {tab === "goal" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card gradient-border p-6 space-y-5">
              <div className="text-sm font-semibold text-white">Goal Parameters</div>
              <Slider label="Target Corpus" value={goal.target} min={100000} max={100000000} step={100000} unit="₹"
                onChange={(v: number) => setGoal(p => ({ ...p, target: v }))} />
              <Slider label="Expected Annual Return" value={goal.rate} min={4} max={30} step={0.5} unit="%"
                onChange={(v: number) => setGoal(p => ({ ...p, rate: v }))} />
              <Slider label="Time to Achieve Goal" value={goal.years} min={1} max={40} unit=" yrs"
                onChange={(v: number) => setGoal(p => ({ ...p, years: v }))} />

              <div className="glass-card p-6 border border-indigo-500/20 bg-indigo-500/5 text-center rounded-xl">
                <div className="text-xs text-slate-400 mb-1">Required Monthly SIP</div>
                <div className="text-4xl font-bold text-indigo-300 font-mono">{formatINR(goalSIP, 0)}</div>
                <div className="text-xs text-slate-500 mt-2">
                  to reach {formatMarketCap(goal.target)} in {goal.years} years at {goal.rate}% p.a.
                </div>
              </div>
            </div>

            <div className="glass-card gradient-border p-6 space-y-4">
              <div className="text-sm font-semibold text-white">Popular Financial Goals</div>
              {[
                { name: "Dream Home Down Payment", amount: 2500000 },
                { name: "Child's Education Fund",  amount: 5000000 },
                { name: "Emergency Fund (6 months)", amount: 600000 },
                { name: "Retirement Corpus",        amount: 50000000 },
                { name: "Car Purchase",             amount: 1500000 },
              ].map(({ name, amount }) => (
                <button key={name}
                  onClick={() => setGoal(p => ({ ...p, target: amount }))}
                  className="w-full text-left px-4 py-3 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
                  <div className="text-sm text-white">{name}</div>
                  <div className="text-xs text-indigo-400 font-mono mt-0.5">{formatMarketCap(amount)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CAGR ─────────────────────────────────────────────────────────── */}
        {tab === "cagr" && (
          <div className="max-w-xl">
            <div className="glass-card gradient-border p-8 space-y-6">
              <div className="text-sm font-semibold text-white">CAGR Calculator</div>
              <p className="text-xs text-slate-500">Compound Annual Growth Rate — the annualised return of any investment.</p>
              {[
                { label: "Buy Price / Initial Value (₹)", value: cagr.buy, key: "buy", min: 1, max: 100000 },
                { label: "Sell Price / Final Value (₹)",  value: cagr.sell, key: "sell", min: 1, max: 200000 },
              ].map(({ label, value, key, min, max }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 block mb-1.5">{label}</label>
                  <input type="number" value={value} min={min} max={max}
                    onChange={(e) => setCagr(p => ({ ...p, [key]: Number(e.target.value) }))}
                    className="input-field font-mono" />
                </div>
              ))}
              <Slider label="Holding Period" value={cagr.years} min={1} max={30} unit=" yrs"
                onChange={(v: number) => setCagr(p => ({ ...p, years: v }))} />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <StatBox label="Absolute Return" value={`${(((cagr.sell - cagr.buy) / cagr.buy) * 100).toFixed(1)}%`}
                  color={cagr.sell >= cagr.buy ? "text-emerald-400" : "text-red-400"} />
                <StatBox label="CAGR" value={`${cagrResult.toFixed(2)}% p.a.`}
                  color={cagrResult >= 0 ? "text-indigo-300" : "text-red-400"} />
              </div>

              <div className="border-t border-white/5 pt-4 text-xs text-slate-600">
                Formula: CAGR = (Sell / Buy)^(1/Years) − 1
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <p className="text-xs text-slate-700 mt-4">
        ⚠️ All calculations are indicative estimates for educational purposes only.
        Actual investment returns depend on market conditions and are not guaranteed.
      </p>
    </div>
  );
}
