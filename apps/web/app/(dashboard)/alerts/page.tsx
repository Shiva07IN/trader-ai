"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR, debounce } from "@/lib/utils";

type Alert = {
  id: string;
  symbol: string;
  name: string;
  type: "above" | "below";
  target: number;
  current?: number;
  triggered?: boolean;
  created_at: string;
};

const STORAGE_KEY = "traderai_alerts";

function loadAlerts(): Alert[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [form, setForm] = useState({ symbol: "", name: "", type: "above" as "above" | "below", target: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const doSearch = debounce(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const data: any = await api.stocks.search(q, 6).catch(() => ({ results: [] }));
    setSearchResults(data.results || []);
  }, 300);

  const selectStock = (sym: string, name: string) => {
    setForm(f => ({ ...f, symbol: sym, name }));
    setQuery(name);
    setSearchResults([]);
  };

  const addAlert = () => {
    if (!form.symbol || !form.target) return;
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol: form.symbol,
      name: form.name,
      type: form.type,
      target: Number(form.target),
      triggered: false,
      created_at: new Date().toISOString(),
    };
    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveAlerts(updated);
    setForm({ symbol: "", name: "", type: "above", target: "" });
    setQuery("");
  };

  const deleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const toggleAlert = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, triggered: !a.triggered } : a);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const active = alerts.filter(a => !a.triggered);
  const triggered = alerts.filter(a => a.triggered);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-400" /> Price Alerts
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Set target price alerts for stocks — tracked locally in your browser
        </p>
      </div>

      {/* Create Alert */}
      <div className="glass-card gradient-border p-6 space-y-4">
        <div className="text-sm font-semibold text-white">Create New Alert</div>

        {/* Stock Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={query}
            onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); setForm(f => ({ ...f, symbol: "", name: "" })); }}
            placeholder="Search stock — RELIANCE, INFY, HDFC..."
            className="input-field pl-9" />
          {query && (
            <button onClick={() => { setQuery(""); setSearchResults([]); setForm(f => ({ ...f, symbol: "", name: "" })); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="border border-white/10 rounded-xl overflow-hidden -mt-2">
            {searchResults.map(r => (
              <button key={r.symbol} onClick={() => selectStock(r.symbol, r.name)}
                className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left">
                <span className="text-sm font-mono font-semibold text-white">{r.symbol.replace(".NS","")}</span>
                <span className="text-xs text-slate-500 truncate ml-2">{r.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Alert type */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Alert when price goes</label>
            <div className="flex gap-2">
              {(["above", "below"] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                    form.type === t
                      ? t === "above" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-red-500/15 border-red-500/30 text-red-300"
                      : "border-white/10 text-slate-500 hover:text-slate-300"
                  }`}>
                  {t === "above" ? "↑ Above" : "↓ Below"}
                </button>
              ))}
            </div>
          </div>

          {/* Target price */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Target Price (₹)</label>
            <input type="number" value={form.target}
              onChange={(e) => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="e.g. 2500"
              className="input-field font-mono" />
          </div>
        </div>

        <button onClick={addAlert} disabled={!form.symbol || !form.target}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 px-5 py-2.5">
          <Plus className="w-4 h-4" />
          Set Alert {form.name && `for ${form.name.split(" ")[0]}`}
        </button>
      </div>

      {/* Active Alerts */}
      {active.length > 0 && (
        <div className="glass-card gradient-border overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">Active Alerts</span>
            <span className="badge badge-info ml-auto">{active.length}</span>
          </div>
          <div className="divide-y divide-white/5">
            {active.map((alert, i) => (
              <motion.div key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.type === "above" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {alert.type === "above"
                      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{alert.symbol.replace(".NS","")}</div>
                    <div className="text-xs text-slate-500">
                      Alert {alert.type} <span className="font-mono text-white">{formatINR(alert.target)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleAlert(alert.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    Mark Triggered
                  </button>
                  <button onClick={() => deleteAlert(alert.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggered.length > 0 && (
        <div className="glass-card overflow-hidden border border-white/5 opacity-60">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <BellOff className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-500">Triggered / Completed</span>
          </div>
          <div className="divide-y divide-white/5">
            {triggered.map(alert => (
              <div key={alert.id} className="flex items-center justify-between px-5 py-3">
                <div className="text-sm text-slate-500 line-through">
                  {alert.symbol.replace(".NS","")} — {alert.type} {formatINR(alert.target)}
                </div>
                <button onClick={() => deleteAlert(alert.id)}
                  className="text-slate-700 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No alerts set yet. Create your first price alert above.</p>
          <p className="text-slate-600 text-xs mt-1">Alerts are stored locally in your browser.</p>
        </div>
      )}
    </div>
  );
}
