"use client";
import { ShieldCheck, TrendingDown, Target, AlertTriangle } from "lucide-react";

interface SwotData {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

interface SWOTGridProps {
  swot: SwotData;
}

const QUADRANTS = [
  { key: "strengths",    label: "Strengths",    icon: ShieldCheck,   color: "emerald", bg: "bg-emerald-500/5 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  { key: "weaknesses",   label: "Weaknesses",   icon: TrendingDown,  color: "red",     bg: "bg-red-500/5 border-red-500/20",         text: "text-red-400",     dot: "bg-red-400" },
  { key: "opportunities",label: "Opportunities",icon: Target,        color: "blue",    bg: "bg-blue-500/5 border-blue-500/20",       text: "text-blue-400",    dot: "bg-blue-400" },
  { key: "threats",      label: "Threats",      icon: AlertTriangle, color: "amber",   bg: "bg-amber-500/5 border-amber-500/20",     text: "text-amber-400",   dot: "bg-amber-400" },
] as const;

export default function SwotGrid({ swot }: SWOTGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADRANTS.map(({ key, label, icon: Icon, bg, text, dot }) => {
        const items: string[] = (swot as any)[key] || [];
        return (
          <div key={key} className={`rounded-xl border p-5 ${bg}`}>
            <div className={`flex items-center gap-2 mb-3 ${text}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                  {item}
                </li>
              ))}
              {!items.length && <li className="text-xs text-slate-600 italic">No data</li>}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
