import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian currency: ₹1,23,456 */
export function formatINR(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Format large numbers: 1,23,45,000 → ₹12.3 Cr */
export function formatMarketCap(value: number | null | undefined): string {
  if (!value) return "—";
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)} L.Cr`;
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)} Cr`;
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  return formatINR(value, 0);
}

/** Format percentage change with + prefix */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

/** Returns Tailwind color class based on positive/negative value */
export function getPnLColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-slate-400";
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

/** Normalize symbol: RELIANCE → RELIANCE.NS */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return "";
  const s = symbol.toUpperCase().trim();
  return s.includes(".") ? s : `${s}.NS`;
}

/** Truncate text to N chars */
export function truncate(text: string, n: number): string {
  return text.length > n ? text.slice(0, n) + "..." : text;
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/** Format a date string as relative time: "2 hours ago" */
export function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ""; }
}
