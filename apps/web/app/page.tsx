import Link from "next/link";
import {
  TrendingUp, Brain, BarChart2, Filter, Bell, MessageSquare,
  ArrowRight, CheckCircle, ChevronRight, Zap, Shield, Star
} from "lucide-react";

const FEATURES = [
  { icon: Brain,        color: "#4F46E5", bg: "rgba(79,70,229,0.12)",   title: "AI Portfolio Intelligence",  desc: "Personalized AI-generated portfolios tailored to your risk profile, goals, and sector preferences." },
  { icon: BarChart2,    color: "#4EDEA3", bg: "rgba(78,222,163,0.12)",  title: "Real-Time Market Data",      desc: "Zero-latency NSE & BSE feeds with live NIFTY, SENSEX, and sector indices updated every second." },
  { icon: TrendingUp,   color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  title: "Deep Stock Analysis",        desc: "Comprehensive fundamental, technical, and AI-powered analysis with SWOT and sentiment scoring." },
  { icon: Filter,       color: "#A78BFA", bg: "rgba(167,139,250,0.12)", title: "Smart Screener",             desc: "Screen 5,000+ stocks instantly with 50+ filters — P/E, ROE, RSI, MACD and more." },
  { icon: Bell,         color: "#2DD4BF", bg: "rgba(45,212,191,0.12)",  title: "Price Alerts",               desc: "Set intelligent price and sentiment alerts. Get notified via SMS and email in real time." },
  { icon: MessageSquare,color: "#4F46E5", bg: "rgba(79,70,229,0.12)",   title: "AI Chat Assistant",          desc: "Conversational market research — ask anything about stocks, sectors, or your portfolio." },
];

const PRICING = [
  {
    tier: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for beginners exploring the platform",
    features: ["5 portfolio analyses/month", "Basic stock data", "Market overview", "Limited AI chat"],
    cta: "Get Started Free",
    featured: false,
  },
  {
    tier: "Pro",
    price: "₹999",
    period: "/month",
    desc: "For serious investors who want the full edge",
    features: ["Unlimited AI portfolios", "Real-time NSE/BSE data", "Advanced screener", "Unlimited AI chat", "Price alerts (SMS + Email)", "Deep stock analysis", "Priority support"],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    tier: "Institutional",
    price: "₹4,999",
    period: "/month",
    desc: "For fund managers and research teams",
    features: ["Everything in Pro", "API access", "Custom watchlists (unlimited)", "Bulk portfolio analysis", "White-label reports", "Dedicated relationship manager"],
    cta: "Contact Sales",
    featured: false,
  },
];

const TESTIMONIALS = [
  { name: "Arjun Sharma", role: "CFA, Equity Analyst", quote: "TraderAI transformed how I research stocks. The institutional-grade data paired with AI insights saves me hours every day.", rating: 5 },
  { name: "Priya Nair", role: "Fund Manager, Mumbai", quote: "The AI portfolio engine is remarkably accurate. It recommended positions that outperformed the index by 12% in Q3.", rating: 5 },
  { name: "Rohit Verma", role: "Retail Investor, Bengaluru", quote: "Finally, a platform that makes sense. The AI explains everything in plain language. I feel confident investing now.", rating: 5 },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)", minHeight: "100vh" }}>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(19,18,27,0.88)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 32 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
              Trader<span style={{ color: "var(--primary-dim)" }}>AI</span>
            </span>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {["Platform", "Features", "Pricing", "Blog"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ padding: "6px 12px", fontSize: 14, color: "var(--text-muted)", textDecoration: "none", borderRadius: 6, transition: "color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{l}</a>
            ))}
          </div>

          {/* Auth */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: "96px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 9999, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            Powered by AI &bull; 50,000+ investors
          </div>

          <h1 className="display-lg" style={{ marginBottom: 20, background: "linear-gradient(135deg, var(--text-primary) 60%, var(--primary-dim))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            The AI-Powered Edge for<br />Indian Stock Markets
          </h1>

          <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Deep research, portfolio intelligence, and market insights — all in one platform built for serious Indian investors.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
            <Link href="/register" className="btn btn-primary btn-xl">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <button className="btn btn-ghost btn-xl">
              Watch Demo <ChevronRight size={18} />
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--text-muted)", fontSize: 13 }}>
            <div style={{ display: "flex" }}>
              {["#4F46E5","#10B981","#F59E0B","#EF4444","#8B5CF6"].map((c,i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: "2px solid var(--bg-base)", marginLeft: i > 0 ? -8 : 0, flexShrink: 0 }} />
              ))}
            </div>
            Join <strong style={{ color: "var(--text-secondary)" }}>50,000+</strong> investors already using TraderAI
          </div>
        </div>

        {/* Dashboard Preview Card */}
        <div style={{ maxWidth: 1000, margin: "56px auto 0", position: "relative" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-default)", boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,70,229,0.1)" }}>
            {/* Fake browser bar */}
            <div style={{ background: "var(--bg-elevated)", padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
              {["#EF4444","#F59E0B","#10B981"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
              <div style={{ flex: 1, background: "var(--bg-highest)", borderRadius: 6, height: 24, marginLeft: 8, display: "flex", alignItems: "center", padding: "0 12px" }}>
                <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>app.traderai.in/dashboard</span>
              </div>
            </div>
            {/* Mini dashboard preview */}
            <div style={{ background: "var(--bg-surface)", padding: 24, display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, minHeight: 320 }}>
              {/* Sidebar preview */}
              <div style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: 16 }}>
                <div className="label-sm" style={{ marginBottom: 12, color: "var(--text-disabled)" }}>MAIN</div>
                {["Dashboard","Portfolio","Watchlist"].map((item, i) => (
                  <div key={item} className={`nav-item ${i === 0 ? "active" : ""}`} style={{ fontSize: 12, padding: "7px 10px", marginBottom: 2 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: i === 0 ? "var(--primary-dim)" : "var(--text-disabled)", opacity: i === 0 ? 1 : 0.4 }} />
                    {item}
                    {i === 0 && <div className="nav-dot" />}
                  </div>
                ))}
              </div>
              {/* Content preview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                  { label: "NIFTY 50", val: "22,456", chg: "+0.80%", up: true },
                  { label: "SENSEX",   val: "73,852", chg: "+0.77%", up: true },
                  { label: "BANK NIFTY", val: "48,234", chg: "-0.26%", up: false },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-label" style={{ fontSize: 9 }}>{s.label}</div>
                    <div className="stat-value" style={{ fontSize: 16 }}>{s.val}</div>
                    <div className={`pnl-badge ${s.up ? "pnl-up" : "pnl-down"}`} style={{ marginTop: 6, fontSize: 10 }}>{s.chg}</div>
                  </div>
                ))}
                <div className="card-ai" style={{ gridColumn: "1/-1", padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Zap size={14} color="var(--primary-dim)" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Insight</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    NIFTY showing strong momentum above 22,400 support. IT sector leading with broad-based institutional buying.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Glow */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(79,70,229,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-disabled)", flexShrink: 0 }}>As seen in</span>
          {["Economic Times", "Moneycontrol", "Mint", "BSE", "SEBI Registered"].map(name => (
            <span key={name} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-disabled)", opacity: 0.6 }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="badge badge-primary" style={{ marginBottom: 16 }}>Platform Features</div>
            <h2 className="display-md" style={{ marginBottom: 16 }}>Everything you need to invest smarter</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Institutional-grade tools democratized for every Indian investor.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card card-hover" style={{ padding: 24, display: "flex", gap: 16 }}>
                <div className="feature-icon-wrap" style={{ background: f.bg, flexShrink: 0 }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{f.title}</div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "80px 24px", background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="display-md" style={{ marginBottom: 12 }}>Simple, transparent pricing</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 16 }}>Start free, upgrade when you're ready.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
            {PRICING.map(p => (
              <div key={p.tier} className={p.featured ? "pricing-card-featured card" : "card"} style={{ padding: 28, position: "relative" }}>
                {p.featured && (
                  <div className="badge badge-primary" style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 10 }}>Most Popular</div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{p.tier}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, fontFamily: "JetBrains Mono", color: "var(--text-primary)" }}>{p.price}</span>
                    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{p.period}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.desc}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
                      <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className={`btn ${p.featured ? "btn-primary" : "btn-ghost"}`} style={{ width: "100%", justifyContent: "center" }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="display-md" style={{ marginBottom: 12 }}>Trusted by serious investors</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 16 }}>Hear from real TraderAI users across India.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", marginBottom: 16 }}>
                  {Array.from({length: t.rating}).map((_,i) => <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" />)}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", background: "linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(79,70,229,0.06) 100%)", border: "1px solid var(--primary-border)", borderRadius: 20, padding: "56px 40px", textAlign: "center" }}>
          <Shield size={40} color="var(--primary-dim)" style={{ marginBottom: 20 }} />
          <h2 className="display-md" style={{ marginBottom: 16 }}>Start your AI-powered investment journey today</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 32 }}>14-day free trial. No credit card required. Cancel anytime.</p>
          <Link href="/register" className="btn btn-primary btn-xl">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "48px 24px 32px", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={14} color="#fff" />
                </div>
                <span style={{ fontWeight: 700 }}>Trader<span style={{ color: "var(--primary-dim)" }}>AI</span></span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                AI-powered Indian stock market intelligence for serious investors.
              </p>
            </div>
            {[["Platform", ["Dashboard","Portfolio","Screener","Alerts"]], ["Resources", ["Blog","Tutorials","API Docs","Changelog"]], ["Company", ["About","Careers","Press","Contact"]], ["Legal", ["Privacy","Terms","SEBI Disclosure","Cookie Policy"]]].map(([title, links]) => (
              <div key={title as string}>
                <div className="label-md" style={{ marginBottom: 14, color: "var(--text-disabled)" }}>{title}</div>
                {(links as string[]).map(l => (
                  <a key={l} href="#" style={{ display: "block", fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 8, transition: "color 120ms" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>© 2026 TraderAI Technologies Pvt. Ltd.</span>
            <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>Investment in securities market are subject to market risks. Read all related documents carefully before investing. SEBI Reg: INH000000000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
