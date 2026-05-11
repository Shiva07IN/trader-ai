"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Moon, Sun, User } from "lucide-react";
import { api } from "@/lib/api";
import { debounce } from "@/lib/utils";

type SearchResult = { symbol: string; name: string; sector?: string };

export default function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const data: any = await api.stocks.search(q);
        setResults(data.results || []);
        setShowResults(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  };

  const handleSelect = (symbol: string) => {
    setQuery("");
    setShowResults(false);
    router.push(`/dashboard/stocks/${symbol.replace(".NS", "").replace(".BO", "")}`);
  };

  return (
    <header className="h-16 flex items-center px-6 gap-4 border-b border-white/5 relative z-20"
      style={{ background: "rgba(5, 8, 17, 0.7)", backdropFilter: "blur(20px)" }}>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search stocks — RELIANCE, TCS, HDFC..."
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="input-field pl-10 py-2 text-sm h-9"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full glass-card rounded-xl border border-white/10 overflow-hidden shadow-card z-50">
            {results.map((r) => (
              <button
                key={r.symbol}
                onMouseDown={() => handleSelect(r.symbol)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-mono font-semibold text-white">
                    {r.symbol.replace(".NS", "").replace(".BO", "")}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[200px]">{r.name}</div>
                </div>
                {r.sector && (
                  <span className="badge badge-info text-xs">{r.sector}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/10 transition-all">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center cursor-pointer shadow-glow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
