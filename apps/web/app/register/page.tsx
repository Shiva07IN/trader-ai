"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-amber-500", "bg-emerald-500"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength - 1] : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? "text-emerald-400" : "text-slate-600"}`}>
            <CheckCircle2 className="w-3 h-3" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      await api.auth.register({ name: data.name, email: data.email, password: data.password });
      router.push("/login?registered=true");
    } catch (e: any) {
      setError(e.message || "Registration failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Trader<span className="text-gradient">AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start investing smarter with AI — it's free</p>
        </div>

        <div className="glass-card gradient-border p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Full Name</label>
              <input {...register("name")} className="input-field" placeholder="Shivam Thakur" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Email</label>
              <input type="email" {...register("email")} className="input-field" placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  {...register("password")}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Confirm Password</label>
              <input type="password" {...register("confirm")} className="input-field" placeholder="••••••••" />
              {errors.confirm && <p className="text-xs text-red-400 mt-1">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserPlus className="w-4 h-4" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600">
            By registering you agree this platform is for educational purposes only.{" "}
            <Link href="#" className="text-indigo-400">SEBI Disclaimer</Link>
          </p>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
