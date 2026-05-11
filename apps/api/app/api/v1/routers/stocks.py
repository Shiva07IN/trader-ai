"""
Stocks Router — Quote, Profile, History, Technicals, Search
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import stock_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/search")
@limiter.limit("60/minute")
async def search_stocks(
    request: Request,
    q: str = Query(min_length=1, max_length=50, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50),
):
    """Search stocks by name or symbol."""
    results = await stock_service.search_stocks(q, limit=limit)
    return {"query": q, "results": results, "count": len(results)}


@router.get("/{symbol}")
@limiter.limit("30/minute")
async def get_stock_profile(
    request: Request,
    symbol: str,
    db: AsyncSession = Depends(get_db),
):
    """Get full stock profile including quote, fundamentals, and AI thesis."""
    profile = await stock_service.get_stock_profile(symbol.upper(), db)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")
    return profile


@router.get("/{symbol}/quote")
@limiter.limit("60/minute")
async def get_stock_quote(
    request: Request,
    symbol: str,
    db: AsyncSession = Depends(get_db),
):
    """Get real-time stock quote (price, change, volume)."""
    quote = await stock_service.get_stock_quote(symbol.upper(), db)
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote not found for '{symbol}'")
    return quote


@router.get("/{symbol}/history")
@limiter.limit("20/minute")
async def get_stock_history(
    request: Request,
    symbol: str,
    period: str = Query(default="1y", description="1d|5d|1mo|3mo|6mo|1y|2y|5y|max"),
    interval: str = Query(default="1d", description="1m|5m|15m|1h|1d|1wk|1mo"),
):
    """Get OHLCV price history."""
    history = await stock_service.get_stock_history(
        symbol.upper(), period=period, interval=interval
    )
    return {"symbol": symbol.upper(), "period": period, "interval": interval, "bars": history}


@router.get("/{symbol}/technicals")
@limiter.limit("20/minute")
async def get_technicals(
    request: Request,
    symbol: str,
):
    """Get technical indicators: RSI, MACD, MAs, Bollinger Bands, support/resistance."""
    technicals = await stock_service.get_stock_technicals(symbol.upper())
    if not technicals:
        raise HTTPException(status_code=404, detail=f"Could not compute technicals for '{symbol}'")
    return {"symbol": symbol.upper(), **technicals}
