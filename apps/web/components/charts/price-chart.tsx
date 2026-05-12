"use client";
import { useEffect, useRef, useState } from "react";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceChartProps {
  data: CandleData[];
  symbol: string;
  period: string;
  onPeriodChange: (p: string) => void;
}

const PERIODS = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];
const PERIOD_MAP: Record<string, { period: string; interval: string }> = {
  "1D": { period: "1d",  interval: "5m" },
  "1W": { period: "5d",  interval: "15m" },
  "1M": { period: "1mo", interval: "1d" },
  "3M": { period: "3mo", interval: "1d" },
  "6M": { period: "6mo", interval: "1d" },
  "1Y": { period: "1y",  interval: "1d" },
  "5Y": { period: "5y",  interval: "1wk" },
};

export { PERIOD_MAP };

export default function PriceChart({ data, symbol, period, onPeriodChange }: PriceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    let chart: any;
    let candleSeries: any;
    let volumeSeries: any;

    const initChart = async () => {
      const { createChart, ColorType, CrosshairMode } = await import("lightweight-charts");

      // Cleanup previous
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }

      chart = createChart(chartRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#94a3b8",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(99,102,241,0.06)" },
          horzLines: { color: "rgba(99,102,241,0.06)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(99,102,241,0.5)", width: 1, style: 3 },
          horzLine: { color: "rgba(99,102,241,0.5)", width: 1, style: 3 },
        },
        rightPriceScale: {
          borderColor: "rgba(99,102,241,0.15)",
          textColor: "#64748b",
        },
        timeScale: {
          borderColor: "rgba(99,102,241,0.15)",
          textColor: "#64748b",
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      // Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0] && chart) {
          const { width, height } = entries[0].contentRect;
          chart.resize(width, height);
        }
      });
      resizeObserver.observe(chartRef.current!);

      // Volume series (background)
      volumeSeries = chart.addHistogramSeries({
        color: "rgba(99,102,241,0.15)",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      // Candlestick series
      candleSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });

      const candleData = data.map((d) => ({
        time: d.time as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volumeData = data.map((d) => ({
        time: d.time as any,
        value: d.volume || 0,
        color: d.close >= d.open ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
      }));

      candleSeries.setData(candleData);
      volumeSeries.setData(volumeData);

      chart.timeScale().fitContent();
      chartInstanceRef.current = chart;
    };

    initChart();

    return () => {
      if (chartInstanceRef.current) {
        try { chartInstanceRef.current.remove(); } catch {}
        chartInstanceRef.current = null;
      }
    };
  }, [data]);

  return (
    <div className="space-y-3">
      {/* Period Selector */}
      <div className="flex items-center gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              period === p
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {(!data.length) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Loading chart...</span>
            </div>
          </div>
        )}
        <div ref={chartRef} className="w-full h-80 rounded-xl overflow-hidden" />
      </div>
    </div>
  );
}
