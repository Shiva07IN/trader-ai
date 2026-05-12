"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, User, Bot, Sparkles, Search, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; id: string };

const QUICK_PROMPTS = [
  "What is a P/E ratio and why does it matter?",
  "Explain SIP investing for beginners",
  "What sectors do well during inflation in India?",
  "How do I read an RSI indicator?",
  "Difference between NSE and BSE",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-gradient-to-br from-indigo-500 to-purple-600"
      }`}>
        {isUser ? <User className="w-4 h-4 text-indigo-300" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[78%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-500/15 border border-indigo-500/20 text-white rounded-tr-sm"
            : "bg-white/5 border border-white/8 text-slate-300 rounded-tl-sm"
        }`}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        {!isUser && (
          <span className="text-xs text-slate-700 px-1">TraderAI · Educational only</span>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Namaste! 🙏 I'm TraderAI, your AI assistant for Indian stock markets.\n\nAsk me anything about investing, stocks, markets, or financial concepts. I'll explain it clearly and add relevant Indian market context.\n\n⚠️ All responses are educational — not investment advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const token = (session as any)?.accessToken || "";
      const data: any = await api.ai.chat({ message: content, history }, token);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "_ai", role: "assistant", content: data.response || "Sorry, I couldn't respond." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "_err", role: "assistant", content: "I'm having trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-400" /> AI Market Assistant
        </h1>
        <p className="text-slate-500 text-sm mt-1">Ask anything about Indian stocks, investing concepts, or market analysis</p>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK_PROMPTS.map((p) => (
          <button key={p} onClick={() => sendMessage(p)}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-all">
            <Sparkles className="w-3 h-3 inline mr-1" />{p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card gradient-border p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about any stock, concept, or market trend..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 flex items-center gap-2 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-700 mt-2 text-center">
        ⚠️ TraderAI is for educational purposes only. Not SEBI-registered investment advice.
      </p>
    </div>
  );
}
