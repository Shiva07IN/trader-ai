"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, ChevronRight, Save, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

const SECTORS = ["Technology", "Financial Services", "Healthcare", "Energy", "Consumer Goods", "Consumer Discretionary", "Industrials", "Materials", "Utilities", "Communication"];
const RISK_OPTIONS = [
  { value: "low",    label: "Conservative", desc: "Large-cap, stable, dividend stocks. Minimal volatility." },
  { value: "medium", label: "Moderate",     desc: "Balanced mix of growth and value across sectors." },
  { value: "high",   label: "Aggressive",   desc: "Mid/small-cap, high-growth potential, higher volatility." },
];
const HORIZON_OPTIONS = [
  { value: "short_term",  label: "Short Term",  desc: "< 1 year" },
  { value: "medium_term", label: "Medium Term", desc: "1–5 years" },
  { value: "long_term",   label: "Long Term",   desc: "5+ years" },
];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = (session as any)?.user;

  const [prefs, setPrefs] = useState({
    name: user?.name || "",
    risk_tolerance: "medium",
    investment_horizon: "long_term",
    preferred_sectors: [] as string[],
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSector = (s: string) => {
    setPrefs((p) => ({
      ...p,
      preferred_sectors: p.preferred_sectors.includes(s)
        ? p.preferred_sectors.filter((x) => x !== s)
        : [...p.preferred_sectors, s],
    }));
  };

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      const token = (session as any)?.accessToken || "";
      await api.auth.updateMe(prefs, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save settings");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" /> Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and investment preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-card gradient-border p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <User className="w-4 h-4 text-indigo-400" /> Profile
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            {(user?.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="text-base font-semibold text-white">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            <span className="badge badge-info text-xs mt-1">Free Plan</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Display Name</label>
          <input
            type="text"
            value={prefs.name}
            onChange={(e) => setPrefs((p) => ({ ...p, name: e.target.value }))}
            className="input-field max-w-sm"
          />
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="glass-card gradient-border p-6 space-y-4">
        <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-indigo-400" /> Risk Tolerance
        </div>
        <div className="grid grid-cols-3 gap-3">
          {RISK_OPTIONS.map((r) => (
            <button key={r.value}
              onClick={() => setPrefs((p) => ({ ...p, risk_tolerance: r.value }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                prefs.risk_tolerance === r.value
                  ? "border-indigo-500/40 bg-indigo-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}>
              <div className={`text-sm font-semibold mb-1 ${prefs.risk_tolerance === r.value ? "text-indigo-300" : "text-white"}`}>{r.label}</div>
              <div className="text-xs text-slate-500">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Investment Horizon */}
      <div className="glass-card gradient-border p-6 space-y-4">
        <div className="text-sm font-semibold text-white mb-1">Investment Horizon</div>
        <div className="grid grid-cols-3 gap-3">
          {HORIZON_OPTIONS.map((h) => (
            <button key={h.value}
              onClick={() => setPrefs((p) => ({ ...p, investment_horizon: h.value }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                prefs.investment_horizon === h.value
                  ? "border-indigo-500/40 bg-indigo-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}>
              <div className={`text-sm font-semibold mb-0.5 ${prefs.investment_horizon === h.value ? "text-indigo-300" : "text-white"}`}>{h.label}</div>
              <div className="text-xs text-slate-500">{h.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Sectors */}
      <div className="glass-card gradient-border p-6 space-y-4">
        <div className="text-sm font-semibold text-white mb-1">Preferred Sectors</div>
        <p className="text-xs text-slate-500">AI portfolio suggestions will prioritise these sectors.</p>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button key={s} onClick={() => toggleSector(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                prefs.preferred_sectors.includes(s)
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "border-white/10 text-slate-500 hover:text-slate-300"
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Save */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>
      )}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
        <p className="text-xs text-slate-600">Your preferences improve AI portfolio recommendations.</p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/5 pt-5">
        <div className="text-xs text-slate-700 leading-relaxed">
          ⚠️ <strong className="text-slate-600">SEBI Disclaimer:</strong> TraderAI is an educational platform only. Content generated is not SEBI-registered investment advice.
          Please consult a SEBI-registered investment adviser before making investment decisions.
        </div>
      </div>
    </div>
  );
}
