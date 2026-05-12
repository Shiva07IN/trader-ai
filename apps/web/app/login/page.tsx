"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) router.push("/dashboard");
    else { setError("Invalid email or password."); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--bg-base)" }}>

      {/* ── Left Panel ───────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48, position: "relative", overflow: "hidden" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>
            Trader<span style={{ color: "var(--primary-dim)" }}>AI</span>
          </span>
        </div>

        {/* Dashboard preview card */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingBlock: 48 }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div className="card-ai" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Zap size={14} color="var(--primary-dim)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI Insight</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
                AI detects bullish divergence on hourly MACD. High probability setup for IT sector breakout.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ sym: "INFY", pct: "+2.1%", up: true }, { sym: "TCS", pct: "+1.4%", up: true }, { sym: "WIPRO", pct: "-0.8%", up: false }].map(s => (
                  <div key={s.sym} style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.sym}</div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: s.up ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{s.pct}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Stat mini cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "NIFTY 50", val: "22,456", chg: "+0.80%" }, { label: "SENSEX", val: "73,852", chg: "+0.77%" }].map(s => (
                <div key={s.label} className="stat-card" style={{ padding: "12px 14px" }}>
                  <div className="stat-label" style={{ fontSize: 9 }}>{s.label}</div>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, marginTop: 4 }}>{s.val}</div>
                  <div className="pnl-badge pnl-up" style={{ marginTop: 6, fontSize: 10 }}>{s.chg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 24 }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, fontStyle: "italic", marginBottom: 14 }}>
            "TraderAI transformed how I research stocks. The institutional-grade data paired with AI insights saves me hours daily."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Arjun Sharma</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>CFA, Equity Analyst</div>
            </div>
          </div>
        </div>

        {/* BG radial */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      </div>

      {/* ── Right Panel — Form ────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Sign in to your TraderAI account</p>
          </div>

          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", color: "#111", border: "none", borderRadius: 8, height: 44, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 20, transition: "opacity 150ms" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: 11, color: "var(--text-disabled)", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          {error && (
            <div style={{ background: "var(--danger-muted)", border: "1px solid rgba(255,117,117,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--primary-dim)", textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input className="input" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 4 }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--primary-dim)", textDecoration: "none", fontWeight: 600 }}>Sign up →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
