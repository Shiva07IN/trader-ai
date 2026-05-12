"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatINR, formatPct, getPnLColor, debounce } from "@/lib/utils";

type WatchlistSymbol = { symbol: string; added_at: string; buy_price?: number; notes?: string };

export default function WatchlistPage() {
  const { data: session } = useSession();
  const [symbols, setSymbols] = useState<WatchlistSymbol[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);

  const token = (session as any)?.accessToken || "";

  const loadWatchlist = useCallback(async () => {
    if (!token) return;
    try {
      const data: any = await api.watchlist.get(token);
      setSymbols(data.symbols || []);
      return data.symbols || [];
    } catch { return []; }
  }, [token]);

  const loadQuotes = useCallback(async (syms: WatchlistSymbol[]) => {
    const results: Record<string, any> = {};
    await Promise.all(
      syms.map(async (s) => {
        try {
          const q: any = await api.stocks.getQuote(s.symbol.replace(".NS","").replace(".BO",""));
          results[s.symbol] = q;
        } catch {}
      })
    );
    setQuotes(results);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const syms = await loadWatchlist();
      if (syms.length) await loadQuotes(syms);
      setLoading(false);
    })();
  }, [loadWatchlist]);

  const refresh = async () => {
    setRefreshing(true);
    const syms = await loadWatchlist();
    if (syms.length) await loadQuotes(syms);
    setRefreshing(false);
  };

  const doSearch = debounce(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const data: any = await api.stocks.search(q);
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); }
  }, 300);

  const addSymbol = async (symbol: string) => {
    setAdding(true);
    try {
      await api.watchlist.add(symbol, token);
      setAddQuery(""); setSearchResults([]);
      const syms = await loadWatchlist();
      await loadQuotes(syms);
    } catch { } finally { setAdding(false); }
  };

  const removeSymbol = async (symbol: string) => {
    try {
      await api.watchlist.remove(symbol, token);
      setSymbols((prev) => prev.filter((s) => s.symbol !== symbol));
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-indigo-400" /> My Watchlist
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track your favourite stocks · Updates every 30s</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Add Stock */}
      <div className="glass-card gradient-border p-5">
        <div className="text-sm font-semibold text-white mb-3">Add a stock</div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={addQuery}
            onChange={(e) => { setAddQuery(e.target.value); doSearch(e.target.value); }}
            placeholder="Search — RELIANCE, TCS, INFY..."
            className="input-field pl-9"
          />
          {addQuery && (
            <button onClick={() => { setAddQuery(""); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 border border-white/10 rounded-xl overflow-hidden">
            {searchResults.map((r) => (
              <button key={r.symbol}
                onClick={() => addSymbol(r.symbol)}
                disabled={adding}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm font-mono font-semibold text-white">{r.symbol.replace(".NS","")}</div>
                  <div className="text-xs text-slate-500">{r.name}</div>
                </div>
                <Plus className="w-4 h-4 text-indigo-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : symbols.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Eye className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No stocks in your watchlist yet.</p>
          <p className="text-slate-600 text-xs mt-1">Search above to add your first stock.</p>
        </div>
      ) : (
        <div className="glass-card gradient-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-right px-5 py-3 font-medium">Price</th>
                <th className="text-right px-5 py-3 font-medium">Change</th>
                <th className="text-right px-5 py-3 font-medium">Day High/Low</th>
                <th className="text-right px-5 py-3 font-medium">Volume</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {symbols.map((s, i) => {
                const q = quotes[s.symbol] || {};
                const isUp = (q.change_pct || 0) >= 0;
                const cleanSymbol = s.symbol.replace(".NS","").replace(".BO","");
                return (
                  <motion.tr
                    key={s.symbol}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/3 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/stocks/${cleanSymbol}`} className="flex items-center gap-3 group-hover:text-indigo-300 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-400">{cleanSymbol[0]}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{cleanSymbol}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-mono font-bold text-white">{q.price ? formatINR(q.price) : "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {q.change_pct !== undefined ? (
                        <span className={`text-sm font-mono font-medium ${getPnLColor(q.change_pct)}`}>
                          {isUp ? "+" : ""}{q.change?.toFixed(2)} ({formatPct(q.change_pct)})
                        </span>
                      ) : <span className="text-slate-600 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500 num">
                      {q.day_high ? <span>{formatINR(q.day_high)} / {formatINR(q.day_low)}</span> : "—"}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500 num">
                      {q.volume ? `${(q.volume / 1e5).toFixed(2)}L` : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => removeSymbol(s.symbol)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
