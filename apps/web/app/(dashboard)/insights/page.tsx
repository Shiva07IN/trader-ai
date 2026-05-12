"use client";
import { useState, useRef, useEffect } from "react";
import { Zap, Send, X, TrendingUp, TrendingDown, ArrowUpRight, Command } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Msg = { role: "user" | "ai"; content: string; stocks?: { sym: string; price: string; chg: string; up: boolean; }[]; streaming?: boolean; };

const SUGGESTED = [
  "Analyze RELIANCE for long-term investment",
  "Best IT stocks this week",
  "NIFTY 50 outlook for next quarter",
  "Explain Price-to-Earnings ratio",
  "SIP vs Lumpsum — which is better?",
  "Top midcap picks for 2026",
];

const INITIAL: Msg[] = [
  {
    role: "ai",
    content: "Hello! I'm your AI investment assistant powered by advanced market intelligence. I can help you analyze stocks, understand market trends, build portfolios, and answer any finance questions.\n\n**What can I help you with today?**",
  },
];

function StockCard({ sym, price, chg, up }: { sym: string; price: string; chg: string; up: boolean }) {
  return (
    <Link href={`/dashboard/stocks/${sym}`}
      style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 14px", textDecoration: "none", transition: "border-color 150ms", marginTop: 10 }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-subtle)")}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 11, color: "var(--primary-dim)" }}>{sym[0]}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>{sym}</div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-muted)" }}>₹{price}</div>
      </div>
      <div>
        <div className={`pnl-badge ${up ? "pnl-up" : "pnl-down"}`} style={{ fontSize: 11 }}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {chg}
        </div>
      </div>
      <ArrowUpRight size={14} color="var(--text-disabled)" />
    </Link>
  );
}

function AIMsgContent({ content }: { content: string }) {
  // Simple markdown: **bold**, bullet points
  const parts = content.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <div key={i} style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{line.slice(2,-2)}</div>;
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "var(--primary-dim)", flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>;
    }
    return <div key={i} style={{ marginBottom: line ? 6 : 4 }}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</div>;
  });
  return <>{parts}</>;
}

export default function InsightsPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || streaming) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: q };
    const aiPlaceholder: Msg = { role: "ai", content: "", streaming: true };
    setMessages(m => [...m, userMsg, aiPlaceholder]);
    setStreaming(true);

    try {
      const token = (session as any)?.accessToken || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: q, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          accumulated += chunk;
          setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: accumulated, streaming: true } : msg));
        }
        setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, streaming: false } : msg));
      }
    } catch {
      setMessages(m => m.map((msg, i) => i === m.length - 1
        ? { ...msg, content: "I'm having trouble connecting to the AI. Please check your API key and try again.", streaming: false }
        : msg));
    }
    setStreaming(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px - 48px)", maxWidth: 900, width: "100%", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Zap size={18} color="var(--primary-dim)" /> AI Insights
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Conversational market intelligence powered by AI</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessages(INITIAL)}>Clear chat</button>
          <div className="badge badge-success"><span className="dot dot-success" />Gemma-3 Online</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "ai" && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                <Zap size={13} color="#fff" />
              </div>
            )}
            <div style={{ maxWidth: "80%" }}>
              {msg.role === "ai" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--primary-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>TraderAI</div>
              )}
              <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}>
                {msg.streaming && !msg.content
                  ? <div style={{ display: "flex", gap: 4 }}>
                      {[0,1,2].map(d => (
                        <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary-dim)", animation: `blink 1.2s ${d*0.3}s infinite` }} />
                      ))}
                    </div>
                  : <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                      <AIMsgContent content={msg.content} />
                      {msg.streaming && <span className="cursor-blink" style={{ color: "var(--primary-dim)" }}>▋</span>}
                    </div>
                }
                {msg.stocks?.map(s => <StockCard key={s.sym} {...s} />)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        {/* Suggestions */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
          {SUGGESTED.map(q => (
            <button key={q} onClick={() => send(q)}
              className="badge badge-neutral"
              style={{ flexShrink: 0, cursor: "pointer", fontSize: 11, padding: "5px 10px", border: "1px solid var(--border-default)", background: "none", transition: "border-color 150ms", whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary-border)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}>
              {q}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div style={{ position: "relative" }}>
          <input
            className="input"
            style={{ paddingRight: 52, paddingBottom: 14, paddingTop: 14, borderRadius: 10, fontSize: 14 }}
            placeholder="Ask anything about stocks, markets, or your portfolio..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            disabled={streaming}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: input.trim() ? "var(--primary)" : "var(--bg-high)", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 150ms" }}>
            <Send size={15} color={input.trim() ? "#fff" : "var(--text-disabled)"} />
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 8, textAlign: "center" }}>
          AI responses are for educational purposes only. Not SEBI-registered investment advice.
        </p>
      </div>
    </div>
  );
}
