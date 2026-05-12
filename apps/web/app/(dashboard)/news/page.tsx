"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

type Article = {
  title: string; description: string; url: string;
  source: string; category: string; sentiment: string; published_at: string;
};

const SENTIMENT_CONFIG = {
  bullish: { icon: TrendingUp,   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Bullish" },
  bearish: { icon: TrendingDown, cls: "text-red-400 bg-red-500/10 border-red-500/20",           label: "Bearish" },
  neutral: { icon: Minus,        cls: "text-slate-400 bg-slate-500/10 border-slate-500/20",      label: "Neutral" },
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await api.news.get();
      setArticles(data.articles || []);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all"
    ? articles
    : articles.filter((a) => a.sentiment === filter);

  const counts = {
    bullish: articles.filter((a) => a.sentiment === "bullish").length,
    bearish: articles.filter((a) => a.sentiment === "bearish").length,
    neutral: articles.filter((a) => a.sentiment === "neutral").length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-400" /> Market News
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aggregated from ET, Moneycontrol, Mint, Business Standard · AI sentiment analysis
          </p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Sentiment filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: `All (${articles.length})` },
          { key: "bullish", label: `Bullish (${counts.bullish})` },
          { key: "bearish", label: `Bearish (${counts.bearish})` },
          { key: "neutral", label: `Neutral (${counts.neutral})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-all ${
              filter === f.key
                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                : "border-white/10 text-slate-500 hover:text-slate-300"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Newspaper className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No articles available. Try refreshing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article, i) => {
            const sent = SENTIMENT_CONFIG[article.sentiment as keyof typeof SENTIMENT_CONFIG] || SENTIMENT_CONFIG.neutral;
            const Icon = sent.icon;
            return (
              <motion.a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card gradient-border p-5 flex gap-4 hover:border-indigo-500/30 transition-all group block"
              >
                <div className={`mt-0.5 p-2 rounded-lg border flex-shrink-0 ${sent.cls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" />
                  </div>
                  {article.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{article.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">{article.source}</span>
                    <span>·</span>
                    <span className={`badge text-xs border ${sent.cls}`}>{sent.label}</span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
}
