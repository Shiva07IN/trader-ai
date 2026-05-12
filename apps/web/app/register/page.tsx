"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff, CheckCircle } from "lucide-react";

function StrengthBar({ pw }: { pw: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  const colors = ["var(--bg-high)", "var(--danger)", "var(--warning)", "var(--success)", "var(--success)"];
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: score >= i ? colors[score] : "var(--bg-high)", transition: "background 200ms" }} />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the Terms of Service."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.name, email: form.email, password: form.password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Registration failed"); }
      await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/dashboard" });
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const FEATURES = [
    "AI-powered portfolio generation",
    "Real-time NSE & BSE data feeds",
    "Advanced stock screener with 50+ filters",
    "Unlimited AI chat for market research",
  ];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--bg-base)" }}>

      {/* ── Left: Feature Panel ──────────────────────────────────── */}
      <div style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>
            Trader<span style={{ color: "var(--primary-dim)" }}>AI</span>
          </span>
        </div>

        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.2 }}>
            Join 50,000+<br />smart investors
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            Get institutional-grade AI tools built for Indian retail investors — free for 14 days.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, borderTop: "1px solid var(--border-subtle)", paddingTop: 24 }}>
          {[["50K+","Investors"],["₹500Cr+","Tracked"],["99.9%","Uptime"]].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: "var(--primary-dim)" }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      </div>

      {/* ── Right: Form ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>Create your account</h1>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--primary-muted)", border: "1px solid var(--primary-border)", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "var(--primary-dim)" }}>
              ✨ Free 14-day trial — no card needed
            </div>
          </div>

          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", color: "#111", border: "none", borderRadius: 8, height: 44, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

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

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Full Name</label>
              <input className="input" type="text" placeholder="Shivam Thakur" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showPw ? "text" : "password"} placeholder="Create a strong password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ paddingRight: 44 }} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && <StrengthBar pw={form.password} />}
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ accentColor: "#4F46E5", marginTop: 2, flexShrink: 0 }} />
              I agree to the <a href="/terms" style={{ color: "var(--primary-dim)", textDecoration: "none" }}>Terms of Service</a> and <a href="/privacy" style={{ color: "var(--primary-dim)", textDecoration: "none" }}>Privacy Policy</a>
            </label>

            <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 4 }} disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 16, lineHeight: 1.5, textAlign: "center" }}>
            TraderAI provides AI-powered research tools. Not SEBI-registered investment advice. Past performance is not indicative of future results.
          </p>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--primary-dim)", textDecoration: "none", fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
