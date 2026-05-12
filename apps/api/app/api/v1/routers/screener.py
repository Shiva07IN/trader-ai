"""
Screener Router — Filter NSE stocks by sector, PE, ROE, market cap, etc.
Uses local stock list for instant results (no live API calls).
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.data.fetchers.yfinance_fetcher import NSE_STOCK_LIST

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

# ── Pre-seeded fundamentals for instant screener (updated by Celery daily) ────
# Realistic data for top 50 NSE stocks for MVP
SCREENER_DATA = {
    "RELIANCE.NS":   {"pe": 22.4, "pb": 2.1, "roe": 9.8,  "div_yield": 0.4, "market_cap": "large", "beta": 1.05, "revenue_growth": 8.2},
    "TCS.NS":        {"pe": 28.1, "pb": 11.2,"roe": 49.8, "div_yield": 1.8, "market_cap": "large", "beta": 0.72, "revenue_growth": 6.8},
    "HDFCBANK.NS":   {"pe": 19.3, "pb": 2.8, "roe": 15.2, "div_yield": 1.2, "market_cap": "large", "beta": 0.91, "revenue_growth": 22.1},
    "INFY.NS":       {"pe": 24.6, "pb": 7.4, "roe": 31.4, "div_yield": 2.6, "market_cap": "large", "beta": 0.81, "revenue_growth": 4.7},
    "ICICIBANK.NS":  {"pe": 17.8, "pb": 2.9, "roe": 17.6, "div_yield": 0.8, "market_cap": "large", "beta": 1.12, "revenue_growth": 26.4},
    "HINDUNILVR.NS": {"pe": 52.3, "pb": 11.8,"roe": 23.1, "div_yield": 1.9, "market_cap": "large", "beta": 0.54, "revenue_growth": 2.1},
    "SBIN.NS":       {"pe": 10.2, "pb": 1.6, "roe": 18.3, "div_yield": 1.7, "market_cap": "large", "beta": 1.34, "revenue_growth": 19.8},
    "BHARTIARTL.NS": {"pe": 68.4, "pb": 6.2, "roe": 9.2,  "div_yield": 0.4, "market_cap": "large", "beta": 0.68, "revenue_growth": 14.2},
    "ITC.NS":        {"pe": 27.8, "pb": 7.1, "roe": 26.4, "div_yield": 3.2, "market_cap": "large", "beta": 0.62, "revenue_growth": 5.4},
    "KOTAKBANK.NS":  {"pe": 21.4, "pb": 3.2, "roe": 14.8, "div_yield": 0.1, "market_cap": "large", "beta": 0.88, "revenue_growth": 17.3},
    "LT.NS":         {"pe": 31.2, "pb": 4.8, "roe": 15.6, "div_yield": 1.1, "market_cap": "large", "beta": 1.18, "revenue_growth": 18.4},
    "AXISBANK.NS":   {"pe": 13.6, "pb": 2.2, "roe": 16.9, "div_yield": 0.1, "market_cap": "large", "beta": 1.21, "revenue_growth": 23.1},
    "ASIANPAINT.NS": {"pe": 58.4, "pb": 17.2,"roe": 30.8, "div_yield": 0.9, "market_cap": "large", "beta": 0.44, "revenue_growth": -4.2},
    "MARUTI.NS":     {"pe": 24.8, "pb": 4.9, "roe": 21.2, "div_yield": 1.2, "market_cap": "large", "beta": 0.87, "revenue_growth": 11.6},
    "WIPRO.NS":      {"pe": 22.1, "pb": 3.8, "roe": 17.4, "div_yield": 0.2, "market_cap": "large", "beta": 0.76, "revenue_growth": -2.1},
    "SUNPHARMA.NS":  {"pe": 34.6, "pb": 5.1, "roe": 15.8, "div_yield": 0.8, "market_cap": "large", "beta": 0.63, "revenue_growth": 10.2},
    "TITAN.NS":      {"pe": 76.8, "pb": 19.4,"roe": 26.2, "div_yield": 0.4, "market_cap": "large", "beta": 0.96, "revenue_growth": 20.4},
    "BAJFINANCE.NS": {"pe": 28.4, "pb": 5.6, "roe": 21.8, "div_yield": 0.4, "market_cap": "large", "beta": 1.42, "revenue_growth": 34.2},
    "ULTRACEMCO.NS": {"pe": 38.2, "pb": 5.8, "roe": 16.2, "div_yield": 0.6, "market_cap": "large", "beta": 0.84, "revenue_growth": 5.8},
    "NESTLEIND.NS":  {"pe": 68.4, "pb": 68.1,"roe": 118.4,"div_yield": 1.8, "market_cap": "large", "beta": 0.38, "revenue_growth": 8.6},
    "POWERGRID.NS":  {"pe": 16.2, "pb": 3.1, "roe": 19.8, "div_yield": 4.2, "market_cap": "large", "beta": 0.52, "revenue_growth": 7.4},
    "NTPC.NS":       {"pe": 14.8, "pb": 1.8, "roe": 12.4, "div_yield": 3.8, "market_cap": "large", "beta": 0.71, "revenue_growth": 12.2},
    "ONGC.NS":       {"pe": 8.4,  "pb": 0.9, "roe": 12.1, "div_yield": 4.8, "market_cap": "large", "beta": 0.94, "revenue_growth": -4.8},
    "HCLTECH.NS":    {"pe": 26.4, "pb": 6.2, "roe": 24.6, "div_yield": 3.4, "market_cap": "large", "beta": 0.82, "revenue_growth": 6.2},
    "TATAMOTORS.NS": {"pe": 9.8,  "pb": 2.4, "roe": 28.4, "div_yield": 0.8, "market_cap": "large", "beta": 1.64, "revenue_growth": 12.8},
    "TATASTEEL.NS":  {"pe": 14.2, "pb": 1.4, "roe": 11.2, "div_yield": 2.4, "market_cap": "large", "beta": 1.48, "revenue_growth": -4.6},
    "ADANIENT.NS":   {"pe": 82.4, "pb": 8.6, "roe": 11.4, "div_yield": 0.1, "market_cap": "large", "beta": 1.86, "revenue_growth": 24.6},
    "ADANIPORTS.NS": {"pe": 28.4, "pb": 5.2, "roe": 18.8, "div_yield": 0.6, "market_cap": "large", "beta": 1.42, "revenue_growth": 22.4},
    "JSWSTEEL.NS":   {"pe": 16.8, "pb": 2.6, "roe": 16.4, "div_yield": 2.1, "market_cap": "large", "beta": 1.38, "revenue_growth": 6.2},
    "CIPLA.NS":      {"pe": 28.6, "pb": 4.8, "roe": 17.2, "div_yield": 0.6, "market_cap": "large", "beta": 0.57, "revenue_growth": 12.4},
    "DRREDDY.NS":    {"pe": 18.4, "pb": 3.6, "roe": 21.4, "div_yield": 0.6, "market_cap": "large", "beta": 0.54, "revenue_growth": 14.2},
    "DIVISLAB.NS":   {"pe": 46.8, "pb": 8.4, "roe": 18.6, "div_yield": 1.2, "market_cap": "large", "beta": 0.48, "revenue_growth": 6.8},
    "BAJAJFINSV.NS": {"pe": 22.4, "pb": 3.8, "roe": 17.6, "div_yield": 0.1, "market_cap": "large", "beta": 1.28, "revenue_growth": 28.4},
    "TECHM.NS":      {"pe": 38.4, "pb": 4.2, "roe": 11.4, "div_yield": 1.8, "market_cap": "large", "beta": 0.88, "revenue_growth": -2.4},
    "INDUSINDBK.NS": {"pe": 11.4, "pb": 1.6, "roe": 15.2, "div_yield": 1.4, "market_cap": "large", "beta": 1.46, "revenue_growth": 18.6},
    "GRASIM.NS":     {"pe": 24.8, "pb": 2.4, "roe": 10.4, "div_yield": 0.6, "market_cap": "large", "beta": 1.12, "revenue_growth": 12.8},
    "HINDALCO.NS":   {"pe": 12.4, "pb": 1.2, "roe": 10.8, "div_yield": 1.4, "market_cap": "large", "beta": 1.52, "revenue_growth": 4.2},
    "TATACONSUM.NS": {"pe": 62.4, "pb": 6.8, "roe": 11.2, "div_yield": 0.8, "market_cap": "mid",   "beta": 0.72, "revenue_growth": 8.4},
    "BRITANNIA.NS":  {"pe": 48.6, "pb": 38.4,"roe": 82.4, "div_yield": 1.8, "market_cap": "mid",   "beta": 0.48, "revenue_growth": 4.6},
    "EICHERMOT.NS":  {"pe": 28.4, "pb": 8.6, "roe": 31.4, "div_yield": 1.6, "market_cap": "mid",   "beta": 0.86, "revenue_growth": 16.8},
    "COALINDIA.NS":  {"pe": 8.6,  "pb": 4.8, "roe": 58.4, "div_yield": 7.2, "market_cap": "large", "beta": 0.68, "revenue_growth": 6.4},
    "VEDL.NS":       {"pe": 12.4, "pb": 1.8, "roe": 16.4, "div_yield": 8.4, "market_cap": "large", "beta": 1.62, "revenue_growth": -2.8},
    "HEROMOTOCO.NS": {"pe": 18.4, "pb": 4.6, "roe": 26.4, "div_yield": 3.8, "market_cap": "large", "beta": 0.72, "revenue_growth": 8.2},
    "APOLLOHOSP.NS": {"pe": 68.4, "pb": 12.4,"roe": 18.6, "div_yield": 0.4, "market_cap": "mid",   "beta": 0.82, "revenue_growth": 14.6},
    "SBILIFE.NS":    {"pe": 74.8, "pb": 11.2,"roe": 15.4, "div_yield": 0.2, "market_cap": "large", "beta": 0.76, "revenue_growth": 18.4},
    "HDFCLIFE.NS":   {"pe": 82.4, "pb": 12.6,"roe": 15.8, "div_yield": 0.4, "market_cap": "large", "beta": 0.68, "revenue_growth": 14.2},
    "ICICIPRULI.NS": {"pe": 78.6, "pb": 10.8,"roe": 13.8, "div_yield": 0.2, "market_cap": "large", "beta": 0.72, "revenue_growth": 16.8},
    "PIDILITIND.NS": {"pe": 74.8, "pb": 18.4,"roe": 25.4, "div_yield": 0.6, "market_cap": "mid",   "beta": 0.44, "revenue_growth": 4.8},
    "DABUR.NS":      {"pe": 44.8, "pb": 10.2,"roe": 23.4, "div_yield": 1.4, "market_cap": "mid",   "beta": 0.42, "revenue_growth": 6.2},
    "MARICO.NS":     {"pe": 46.4, "pb": 14.8,"roe": 34.6, "div_yield": 1.8, "market_cap": "mid",   "beta": 0.38, "revenue_growth": 4.4},
}


@router.get("")
@limiter.limit("30/minute")
async def screen_stocks(
    request: Request,
    sectors: Optional[str] = Query(None, description="Comma-separated sectors"),
    min_roe: Optional[float] = Query(None, ge=0),
    max_pe: Optional[float] = Query(None, ge=0),
    min_pe: Optional[float] = Query(None, ge=0),
    min_div_yield: Optional[float] = Query(None, ge=0),
    market_cap: Optional[str] = Query(None, description="large|mid|small"),
    sort_by: str = Query(default="roe", description="pe|roe|div_yield|revenue_growth"),
    sort_order: str = Query(default="desc", description="asc|desc"),
    limit: int = Query(default=20, ge=1, le=50),
):
    """
    Screen stocks by fundamental filters.
    Returns instantly from pre-seeded local data.
    """
    sector_list = [s.strip() for s in sectors.split(",")] if sectors else []

    results = []
    for stock in NSE_STOCK_LIST:
        symbol = stock["symbol"]
        fundamentals = SCREENER_DATA.get(symbol, {})
        if not fundamentals:
            continue

        # ── Apply filters ─────────────────────────────────────────────────────
        if sector_list and stock.get("sector") not in sector_list:
            continue
        if min_roe is not None and (fundamentals.get("roe") or 0) < min_roe:
            continue
        if max_pe is not None and (fundamentals.get("pe") or 999) > max_pe:
            continue
        if min_pe is not None and (fundamentals.get("pe") or 0) < min_pe:
            continue
        if min_div_yield is not None and (fundamentals.get("div_yield") or 0) < min_div_yield:
            continue
        if market_cap and fundamentals.get("market_cap") != market_cap:
            continue

        results.append({
            "symbol": symbol,
            "name": stock["name"],
            "sector": stock["sector"],
            **fundamentals,
        })

    # ── Sort ──────────────────────────────────────────────────────────────────
    reverse = sort_order == "desc"
    results.sort(key=lambda x: x.get(sort_by) or 0, reverse=reverse)

    return {
        "total": len(results),
        "results": results[:limit],
        "filters_applied": {
            "sectors": sector_list,
            "min_roe": min_roe,
            "max_pe": max_pe,
            "min_pe": min_pe,
            "min_div_yield": min_div_yield,
            "market_cap": market_cap,
        },
    }
