"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight, Plus, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { formatINR, formatPct, getPnLColor } from "@/lib/utils";
import { useSession } from "next-auth/react";

const SECTORS = [
  "Technology", "Financial Services", "Healthcare", "Consumer Goods",
  "Energy", "Industrials", "Materials", "Communication", "Utilities",
  "Consumer Discretionary", "Real Estate",
];

const portfolioSchema = z.object({
  investment_amount: z.number().min(1000, "Minimum ₹1,000"),
  sip_amount: z.number().min(0).optional(),
  risk_tolerance: z.enum(["low", "medium", "high"]),
  investment_horizon: z.enum(["short_term", "medium_term", "long_term"]),
  age: z.number().min(18).max(100).optional(),
  goals: z.string().max(500).optional(),
  name: z.string().min(1).max(100).default("AI Portfolio"),
});

type PortfolioForm = z.infer<typeof portfolioSchema>;

type Holding = {
  symbol: string; name: string; sector: string;
  allocation_pct: number; amount_inr: number;
  reasoning: string; risk_level: string;
  expected_cagr: number; time_horizon: string;
};

type PortfolioResult = {
  id: string; holdings: Holding[]; ai_summary: string;
  expected_cagr: number; risk_profile: string;
};

const RISK_OPTIONS = [
  { value: "low", label: "Low", desc: "Capital preservation, large-caps, dividends", color: "emerald" },
  { value: "medium", label: "Medium", desc: "Balanced growth, mix of large & mid-cap", color: "amber" },
  { value: "high", label: "High", desc: "Aggressive growth, mid & small-cap exposure", color: "red" },
];

const HORIZON_OPTIONS = [
  { value: "short_term", label: "Short Term", desc: "< 1 year" },
  { value: "medium_term", label: "Medium Term", desc: "1–5 years" },
  { value: "long_term", label: "Long Term", desc: "> 5 years" },
];

function AllocationBar({ pct, color = "indigo" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
      />
    </div>
  );
}

export default function PortfolioPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<"form" | "generating" | "result">("form");
  const [sectors, setSectors] = useState<string[]>([]);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PortfolioForm>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: { risk_tolerance: "medium", investment_horizon: "long_term", name: "My AI Portfolio" },
  });

  const selectedRisk = watch("risk_tolerance");
  const selectedHorizon = watch("investment_horizon");

  const toggleSector = (s: string) => {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const onSubmit = async (data: PortfolioForm) => {
    setError(null);
    setStep("generating");
    try {
      const token = (session as any)?.accessToken;
      const res: any = await api.portfolio.generate(
        { ...data, preferred_sectors: sectors },
        token || ""
      );
      setResult(res.portfolio);
      setStep("result");
    } catch (e: any) {
      setError(e.message || "Portfolio generation failed. Check your OpenAI key.");
      setStep("form");
    }
  };

  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-indigo-500/20 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Generating your portfolio...</h2>
          <p className="text-slate-500 text-sm">AI is analyzing NSE stocks and building your personalized portfolio</p>
        </div>
        <div className="flex gap-2">
          {["Analyzing market data", "Selecting stocks", "Optimizing allocation"].map((step, i) => (
            <div key={step} className="badge badge-info text-xs animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Your AI Portfolio</h1>
            <p className="text-slate-500 text-sm mt-1">Generated by GPT-4o • Educational purposes only</p>
          </div>
          <button onClick={() => setStep("form")} className="btn-ghost flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Portfolio
          </button>
        </div>

        {/* Summary Card */}
        <div className="glass-card gradient-border p-6">
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div>
              <div className="stat-label">Expected CAGR</div>
              <div className="text-2xl font-bold text-emerald-400 num">{result.expected_cagr}%</div>
            </div>
            <div>
              <div className="stat-label">Risk Profile</div>
              <div className="text-2xl font-bold text-white capitalize">{result.risk_profile?.replace("_", " ")}</div>
            </div>
            <div>
              <div className="stat-label">Holdings</div>
              <div className="text-2xl font-bold text-white">{result.holdings.length} stocks</div>
            </div>
          </div>
          {result.ai_summary && (
            <div className="border-t border-white/5 pt-4">
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{result.ai_summary}</p>
            </div>
          )}
        </div>

        {/* Holdings */}
        <div className="glass-card gradient-border p-6">
          <h2 className="section-title mb-5">Portfolio Holdings</h2>
          <div className="space-y-4">
            {result.holdings.map((h, i) => (
              <motion.div
                key={h.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border border-white/5 rounded-xl p-4 hover:border-indigo-500/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-300">{h.symbol.replace(".NS","")[0]}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{h.symbol.replace(".NS","")}</div>
                      <div className="text-xs text-slate-500">{h.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white num">{formatINR(h.amount_inr, 0)}</div>
                    <div className="text-xs text-indigo-400 num font-semibold">{h.allocation_pct}%</div>
                  </div>
                </div>
                <AllocationBar pct={h.allocation_pct} />
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="badge badge-info">{h.sector}</span>
                  <span className={`badge ${h.risk_level === "low" ? "badge-success" : h.risk_level === "high" ? "badge-danger" : "badge-warning"}`}>
                    {h.risk_level} risk
                  </span>
                  <span className="badge badge-neutral num">~{h.expected_cagr}% CAGR</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{h.reasoning}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-2 text-xs text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>This portfolio is AI-generated for educational purposes only and does not constitute investment advice. Consult a SEBI-registered investment adviser before investing.</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-400" />
          AI Portfolio Builder
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tell us your goals and investment profile — our AI will build you a diversified NSE portfolio.
        </p>
      </div>

      {error && (
        <div className="glass-card p-4 border border-red-500/20 bg-red-500/5 flex gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Portfolio Name */}
        <div className="glass-card gradient-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Portfolio Details</h2>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Portfolio Name</label>
            <input {...register("name")} className="input-field" placeholder="My Long-Term Portfolio" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Investment Amount (₹)</label>
              <input
                type="number"
                {...register("investment_amount", { valueAsNumber: true })}
                className="input-field"
                placeholder="100000"
              />
              {errors.investment_amount && <p className="text-xs text-red-400 mt-1">{errors.investment_amount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Monthly SIP (₹)</label>
              <input
                type="number"
                {...register("sip_amount", { valueAsNumber: true })}
                className="input-field"
                placeholder="5000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Your Age</label>
              <input
                type="number"
                {...register("age", { valueAsNumber: true })}
                className="input-field"
                placeholder="28"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Investment Goals</label>
              <input {...register("goals")} className="input-field" placeholder="Wealth creation, retirement..." />
            </div>
          </div>
        </div>

        {/* Risk Tolerance */}
        <div className="glass-card gradient-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Risk Tolerance</h2>
          <div className="grid grid-cols-3 gap-3">
            {RISK_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setValue("risk_tolerance", opt.value as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRisk === opt.value
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="text-sm font-semibold text-white mb-0.5">{opt.label}</div>
                <div className="text-xs text-slate-500 leading-tight">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Horizon */}
        <div className="glass-card gradient-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Investment Horizon</h2>
          <div className="grid grid-cols-3 gap-3">
            {HORIZON_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setValue("investment_horizon", opt.value as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedHorizon === opt.value
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="text-sm font-semibold text-white">{opt.label}</div>
                <div className="text-xs text-slate-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Sectors */}
        <div className="glass-card gradient-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">
            Preferred Sectors
            <span className="text-slate-500 text-xs font-normal ml-2">(optional — select any)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <button
                type="button"
                key={sector}
                onClick={() => toggleSector(sector)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  sectors.includes(sector)
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                    : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                }`}
              >
                {sectors.includes(sector) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                {sector}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
        >
          <Brain className="w-5 h-5" />
          Generate My AI Portfolio
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
