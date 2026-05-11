"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp, Brain, Shield, BarChart2, Zap,
  ChevronRight, Star, ArrowRight, Activity
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Portfolio Builder",
    desc: "Input your goals, risk profile, and investment amount. Get a research-backed, diversified NSE/BSE portfolio in seconds.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: BarChart2,
    title: "Deep Stock Research",
    desc: "SWOT analysis, earnings trends, PE comparison, debt analysis, and an AI-generated investment thesis for every stock.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Activity,
    title: "Technical Analysis",
    desc: "RSI, MACD, Bollinger Bands, support/resistance, trend detection — powered by live NSE data.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Zap,
    title: "Real-Time Insights",
    desc: "Live Nifty 50, Sensex, Bank Nifty. FII/DII data. AI-powered market sentiment. Indian macro context.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Shield,
    title: "Risk Intelligence",
    desc: "Every recommendation comes with risk scoring, key risk factors, and SEBI-compliant disclaimers.",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Tracking",
    desc: "Watchlists, gain/loss tracking, AI insights on your holdings. Your investing command center.",
    color: "from-violet-500 to-indigo-600",
  },
];

const STATS = [
  { value: "500+", label: "NSE Stocks Covered" },
  { value: "AI", label: "GPT-4o Powered" },
  { value: "Real-Time", label: "Market Data" },
  { value: "Free", label: "To Get Started" },
];

const NIFTY_STOCKS = [
  { symbol: "RELIANCE", price: "₹2,847", change: "+1.24%", up: true },
  { symbol: "TCS", price: "₹3,912", change: "+0.87%", up: true },
  { symbol: "HDFCBANK", price: "₹1,621", change: "-0.34%", up: false },
  { symbol: "INFY", price: "₹1,487", change: "+2.15%", up: true },
  { symbol: "ICICIBANK", price: "₹1,134", change: "+0.62%", up: true },
  { symbol: "SBIN", price: "₹798", change: "-0.18%", up: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Trader<span className="text-gradient">AI</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {["Features", "Pricing", "About"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 mb-8"
          >
            <Star className="w-3 h-3 fill-current" />
            India's first AI-powered stock research assistant
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"
          >
            Invest smarter with
            <br />
            <span className="text-gradient">AI-powered research</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Portfolio recommendations, deep stock analysis, and real-time market intelligence
            — all powered by AI, designed for Indian investors on NSE &amp; BSE.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register" className="btn-primary flex items-center gap-2 justify-center text-base px-8 py-3">
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="btn-ghost flex items-center gap-2 justify-center text-base px-8 py-3">
              View Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* ── Live Ticker ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-5xl mx-auto mt-20 glass-card gradient-border p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live NSE</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {NIFTY_STOCKS.map((stock) => (
              <div key={stock.symbol} className="text-center">
                <div className="text-xs font-mono font-semibold text-slate-300 mb-1">{stock.symbol}</div>
                <div className="text-sm font-bold text-white">{stock.price}</div>
                <div className={`text-xs font-medium ${stock.up ? "text-emerald-400" : "text-red-400"}`}>
                  {stock.change}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl font-extrabold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to invest <span className="text-gradient">confidently</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete AI research platform built for Indian retail investors — from beginners to experienced traders.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card gradient-border p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card gradient-border p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to invest smarter?
              </h2>
              <p className="text-slate-400 mb-8">
                Join thousands of Indian investors using AI to make better decisions.
                Free to start — no credit card required.
              </p>
              <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-3">
                Get Started for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-slate-600 mt-4">
                ⚠️ TraderAI is for educational purposes only. Not investment advice. Please consult a SEBI-registered advisor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>TraderAI © 2025. Built for Indian investors.</span>
          </div>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Disclaimer", "SEBI Disclosure"].map((item) => (
              <Link key={item} href="#" className="hover:text-slate-400 transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
