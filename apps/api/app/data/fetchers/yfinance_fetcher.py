"""
yfinance Data Fetcher — Async wrapper for Indian stock market data
Handles NSE (.NS) and BSE (.BO) symbols.
Structured for easy swap to paid APIs (Kite Connect, EODHD).
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import pandas as pd
import pandas_ta as ta
import yfinance as yf

logger = logging.getLogger(__name__)

# Thread pool for running blocking yfinance calls asynchronously
_executor = ThreadPoolExecutor(max_workers=10)


def _run_sync(func, *args, **kwargs):
    """Helper to run sync functions in thread pool."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(_executor, lambda: func(*args, **kwargs))


def _normalize_symbol(symbol: str) -> str:
    """
    Normalize symbol for yfinance.
    Examples: RELIANCE → RELIANCE.NS, TATASTEEL.NS → TATASTEEL.NS
    """
    symbol = symbol.upper().strip()
    if "." not in symbol:
        return f"{symbol}.NS"  # Default to NSE
    return symbol


# ─── Quote ────────────────────────────────────────────────────────────────────
async def get_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """Fetch real-time quote for a single stock."""
    symbol = _normalize_symbol(symbol)
    try:
        def _fetch():
            ticker = yf.Ticker(symbol)
            info = ticker.fast_info
            history = ticker.history(period="2d", interval="1d")
            return info, history

        info, history = await _run_sync(_fetch)

        if history.empty:
            logger.warning("No data found for symbol: %s", symbol)
            return None

        current_price = float(info.last_price) if hasattr(info, "last_price") else float(history["Close"].iloc[-1])
        prev_close = float(history["Close"].iloc[-2]) if len(history) > 1 else current_price
        change = current_price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0

        return {
            "symbol": symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "volume": int(history["Volume"].iloc[-1]) if not history.empty else 0,
            "day_high": round(float(history["High"].iloc[-1]), 2),
            "day_low": round(float(history["Low"].iloc[-1]), 2),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Quote fetch failed for %s: %s", symbol, e)
        return None


# ─── Profile + Fundamentals ───────────────────────────────────────────────────
async def get_profile(symbol: str) -> Optional[Dict[str, Any]]:
    """Fetch full stock profile including fundamentals."""
    symbol = _normalize_symbol(symbol)
    try:
        def _fetch():
            ticker = yf.Ticker(symbol)
            return ticker.info

        info = await _run_sync(_fetch)

        if not info or info.get("regularMarketPrice") is None:
            return None

        return {
            # Identity
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName", symbol),
            "exchange": "NSE" if symbol.endswith(".NS") else "BSE",
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "description": info.get("longBusinessSummary"),
            "isin": info.get("isin"),
            "website": info.get("website"),
            # Price
            "price": info.get("regularMarketPrice"),
            "prev_close": info.get("regularMarketPreviousClose"),
            "day_high": info.get("dayHigh"),
            "day_low": info.get("dayLow"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "volume": info.get("regularMarketVolume"),
            "avg_volume": info.get("averageVolume"),
            "market_cap": info.get("marketCap"),
            # Fundamentals
            "fundamentals": {
                "pe_ratio": info.get("trailingPE"),
                "pb_ratio": info.get("priceToBook"),
                "eps": info.get("trailingEps"),
                "roe": info.get("returnOnEquity"),
                "roce": None,  # yfinance doesn't provide ROCE directly
                "debt_to_equity": info.get("debtToEquity"),
                "current_ratio": info.get("currentRatio"),
                "dividend_yield": info.get("dividendYield"),
                "revenue_growth_yoy": info.get("revenueGrowth"),
                "earnings_growth_yoy": info.get("earningsGrowth"),
                "profit_margin": info.get("profitMargins"),
                "book_value": info.get("bookValue"),
                "face_value": info.get("faceValue"),
                "beta": info.get("beta"),
                "float_shares": info.get("floatShares"),
                "shares_outstanding": info.get("sharesOutstanding"),
            },
        }
    except Exception as e:
        logger.error("Profile fetch failed for %s: %s", symbol, e)
        return None


# ─── Historical OHLCV ─────────────────────────────────────────────────────────
async def get_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
) -> List[Dict[str, Any]]:
    """
    Fetch OHLCV historical data.
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    """
    symbol = _normalize_symbol(symbol)
    try:
        def _fetch():
            ticker = yf.Ticker(symbol)
            return ticker.history(period=period, interval=interval)

        df: pd.DataFrame = await _run_sync(_fetch)

        if df.empty:
            return []

        records = []
        for idx, row in df.iterrows():
            records.append({
                "date": idx.strftime("%Y-%m-%d") if interval == "1d" else idx.strftime("%Y-%m-%dT%H:%M:%S"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return records
    except Exception as e:
        logger.error("History fetch failed for %s: %s", symbol, e)
        return []


# ─── Technical Indicators ─────────────────────────────────────────────────────
async def get_technicals(symbol: str) -> Optional[Dict[str, Any]]:
    """Calculate technical indicators using pandas-ta."""
    symbol = _normalize_symbol(symbol)
    try:
        def _fetch_and_calculate():
            ticker = yf.Ticker(symbol)
            df = ticker.history(period="1y", interval="1d")
            if df.empty or len(df) < 50:
                return None

            close = df["Close"]
            high = df["High"]
            low = df["Low"]
            volume = df["Volume"]

            # ── Trend Indicators ──────────────────────────────────────────────
            df.ta.sma(length=20, append=True)
            df.ta.sma(length=50, append=True)
            df.ta.sma(length=200, append=True)
            df.ta.ema(length=20, append=True)

            # ── Momentum ──────────────────────────────────────────────────────
            df.ta.rsi(length=14, append=True)
            macd = df.ta.macd(fast=12, slow=26, signal=9, append=True)

            # ── Volatility ────────────────────────────────────────────────────
            df.ta.bbands(length=20, std=2, append=True)

            # Get last values
            last = df.iloc[-1]
            current_price = float(close.iloc[-1])

            # ── Support & Resistance (simple pivot method) ────────────────────
            recent = df.tail(30)
            highs = recent["High"].nlargest(3).round(2).tolist()
            lows = recent["Low"].nsmallest(3).round(2).tolist()

            # ── Trend Detection ───────────────────────────────────────────────
            sma_20 = last.get("SMA_20")
            sma_50 = last.get("SMA_50")
            sma_200 = last.get("SMA_200")
            if sma_20 and sma_50 and sma_200:
                if current_price > sma_20 > sma_50 > sma_200:
                    trend = "strongly_bullish"
                elif current_price > sma_50:
                    trend = "bullish"
                elif current_price < sma_50 < sma_200:
                    trend = "bearish"
                else:
                    trend = "sideways"
            else:
                trend = "unknown"

            # ── RSI Signal ────────────────────────────────────────────────────
            rsi = last.get("RSI_14")
            if rsi:
                if rsi < 30:
                    signal = "oversold_buy"
                elif rsi > 70:
                    signal = "overbought_sell"
                else:
                    signal = "neutral"
            else:
                signal = "neutral"

            def safe_float(val) -> Optional[float]:
                try:
                    v = float(val)
                    return None if pd.isna(v) else round(v, 2)
                except (TypeError, ValueError):
                    return None

            return {
                "rsi_14": safe_float(last.get("RSI_14")),
                "macd": safe_float(last.get("MACD_12_26_9")),
                "macd_signal": safe_float(last.get("MACDs_12_26_9")),
                "macd_histogram": safe_float(last.get("MACDh_12_26_9")),
                "sma_20": safe_float(last.get("SMA_20")),
                "sma_50": safe_float(last.get("SMA_50")),
                "sma_200": safe_float(last.get("SMA_200")),
                "ema_20": safe_float(last.get("EMA_20")),
                "bb_upper": safe_float(last.get("BBU_20_2.0")),
                "bb_middle": safe_float(last.get("BBM_20_2.0")),
                "bb_lower": safe_float(last.get("BBL_20_2.0")),
                "support_levels": lows,
                "resistance_levels": highs,
                "trend": trend,
                "signal": signal,
                "volume_sma_20": safe_float(volume.rolling(20).mean().iloc[-1]),
                "current_volume": int(volume.iloc[-1]),
            }

        result = await _run_sync(_fetch_and_calculate)
        return result
    except Exception as e:
        logger.error("Technicals failed for %s: %s", symbol, e)
        return None


# ─── Search ───────────────────────────────────────────────────────────────────

# Predefined NSE top-500 index for search (subset for MVP)
NSE_STOCK_LIST = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "sector": "Energy"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "sector": "Technology"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "sector": "Financial Services"},
    {"symbol": "INFY.NS", "name": "Infosys Ltd", "sector": "Technology"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "sector": "Financial Services"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd", "sector": "Consumer Goods"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Financial Services"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd", "sector": "Communication"},
    {"symbol": "ITC.NS", "name": "ITC Ltd", "sector": "Consumer Goods"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank Ltd", "sector": "Financial Services"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro Ltd", "sector": "Industrials"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank Ltd", "sector": "Financial Services"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints Ltd", "sector": "Materials"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki India Ltd", "sector": "Consumer Discretionary"},
    {"symbol": "WIPRO.NS", "name": "Wipro Ltd", "sector": "Technology"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries", "sector": "Healthcare"},
    {"symbol": "TITAN.NS", "name": "Titan Company Ltd", "sector": "Consumer Discretionary"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd", "sector": "Financial Services"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement Ltd", "sector": "Materials"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India Ltd", "sector": "Consumer Goods"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corporation", "sector": "Utilities"},
    {"symbol": "NTPC.NS", "name": "NTPC Ltd", "sector": "Utilities"},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corporation", "sector": "Energy"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies Ltd", "sector": "Technology"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "sector": "Consumer Discretionary"},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel Ltd", "sector": "Materials"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises Ltd", "sector": "Industrials"},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports and SEZ Ltd", "sector": "Industrials"},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel Ltd", "sector": "Materials"},
    {"symbol": "CIPLA.NS", "name": "Cipla Ltd", "sector": "Healthcare"},
    {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's Laboratories", "sector": "Healthcare"},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories", "sector": "Healthcare"},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv Ltd", "sector": "Financial Services"},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra Ltd", "sector": "Technology"},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank Ltd", "sector": "Financial Services"},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries Ltd", "sector": "Materials"},
    {"symbol": "HINDALCO.NS", "name": "Hindalco Industries Ltd", "sector": "Materials"},
    {"symbol": "TATACONSUM.NS", "name": "Tata Consumer Products", "sector": "Consumer Goods"},
    {"symbol": "BRITANNIA.NS", "name": "Britannia Industries Ltd", "sector": "Consumer Goods"},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors Ltd", "sector": "Consumer Discretionary"},
    {"symbol": "COALINDIA.NS", "name": "Coal India Ltd", "sector": "Energy"},
    {"symbol": "VEDL.NS", "name": "Vedanta Ltd", "sector": "Materials"},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp Ltd", "sector": "Consumer Discretionary"},
    {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals Enterprise", "sector": "Healthcare"},
    {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance Company", "sector": "Financial Services"},
    {"symbol": "HDFCLIFE.NS", "name": "HDFC Life Insurance Company", "sector": "Financial Services"},
    {"symbol": "ICICIPRULI.NS", "name": "ICICI Prudential Life Insurance", "sector": "Financial Services"},
    {"symbol": "PIDILITIND.NS", "name": "Pidilite Industries Ltd", "sector": "Materials"},
    {"symbol": "DABUR.NS", "name": "Dabur India Ltd", "sector": "Consumer Goods"},
    {"symbol": "MARICO.NS", "name": "Marico Ltd", "sector": "Consumer Goods"},
]


def search_stocks(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search stocks by name or symbol (local index for MVP)."""
    query = query.upper().strip()
    results = []
    for stock in NSE_STOCK_LIST:
        if (
            query in stock["symbol"].upper()
            or query in stock["name"].upper()
        ):
            results.append(stock)
            if len(results) >= limit:
                break
    return results
