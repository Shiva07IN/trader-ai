"use client";
import { formatINR } from "@/lib/utils";

interface Fundamentals {
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  eps?: number | null;
  roe?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  dividend_yield?: number | null;
  profit_margin?: number | null;
  book_value?: number | null;
  beta?: number | null;
  revenue_growth_yoy?: number | null;
  earnings_growth_yoy?: number | null;
}

function fmt(val: number | null | undefined, suffix = "", multiplier = 1, decimals = 2) {
  if (val === null || val === undefined) return "—";
  return `${(val * multiplier).toFixed(decimals)}${suffix}`;
}

function RatingBadge({ val, low, high, reverse = false }: { val: number; low: number; high: number; reverse?: boolean }) {
  let label = "Average";
  let cls = "badge-warning";
  const good = reverse ? val < low : val > high;
  const bad = reverse ? val > high : val < low;
  if (good) { label = "Good"; cls = "badge-success"; }
  if (bad) { label = "Weak"; cls = "badge-danger"; }
  return <span className={`badge ${cls} text-xs`}>{label}</span>;
}

export default function FundamentalsTable({ fundamentals }: { fundamentals: Fundamentals }) {
  const rows = [
    {
      label: "P/E Ratio",
      value: fmt(fundamentals.pe_ratio, "x"),
      hint: "Price to Earnings",
      badge: fundamentals.pe_ratio
        ? <RatingBadge val={fundamentals.pe_ratio} low={10} high={30} reverse />
        : null,
    },
    {
      label: "P/B Ratio",
      value: fmt(fundamentals.pb_ratio, "x"),
      hint: "Price to Book",
      badge: fundamentals.pb_ratio
        ? <RatingBadge val={fundamentals.pb_ratio} low={1} high={5} reverse />
        : null,
    },
    { label: "EPS", value: formatINR(fundamentals.eps), hint: "Earnings Per Share", badge: null },
    {
      label: "ROE",
      value: fmt(fundamentals.roe, "%", 100),
      hint: "Return on Equity",
      badge: fundamentals.roe
        ? <RatingBadge val={fundamentals.roe * 100} low={12} high={20} />
        : null,
    },
    {
      label: "Debt / Equity",
      value: fmt(fundamentals.debt_to_equity, "x"),
      hint: "Leverage ratio",
      badge: fundamentals.debt_to_equity
        ? <RatingBadge val={fundamentals.debt_to_equity} low={0} high={1} reverse />
        : null,
    },
    { label: "Current Ratio", value: fmt(fundamentals.current_ratio, "x"), hint: "Liquidity", badge: null },
    {
      label: "Dividend Yield",
      value: fmt(fundamentals.dividend_yield, "%", 100),
      hint: "Annual dividend / price",
      badge: null,
    },
    {
      label: "Profit Margin",
      value: fmt(fundamentals.profit_margin, "%", 100),
      hint: "Net profit margin",
      badge: fundamentals.profit_margin
        ? <RatingBadge val={fundamentals.profit_margin * 100} low={10} high={20} />
        : null,
    },
    { label: "Book Value", value: formatINR(fundamentals.book_value), hint: "Per share", badge: null },
    { label: "Beta", value: fmt(fundamentals.beta, "", 1, 2), hint: "Market volatility", badge: null },
    {
      label: "Revenue Growth",
      value: fmt(fundamentals.revenue_growth_yoy, "%", 100),
      hint: "Year-over-year",
      badge: null,
    },
    {
      label: "Earnings Growth",
      value: fmt(fundamentals.earnings_growth_yoy, "%", 100),
      hint: "Year-over-year",
      badge: null,
    },
  ];

  return (
    <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
            <div>
              <div className="text-sm text-white">{row.label}</div>
              <div className="text-xs text-slate-600">{row.hint}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-semibold text-white">{row.value}</span>
              {row.badge}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
