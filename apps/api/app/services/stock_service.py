"""
Stock Service — Orchestrates data fetching, caching, and DB persistence
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_get, cache_set, CacheKeys
from app.core.config import settings
from app.data.fetchers import yfinance_fetcher as yf_fetcher
from app.models.stock import Stock

logger = logging.getLogger(__name__)


async def get_stock_quote(symbol: str, db: AsyncSession) -> Optional[Dict[str, Any]]:
    """Get stock quote — Redis cache → yfinance → DB cache."""
    cache_key = CacheKeys.stock_quote(symbol)

    # 1. Redis cache
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # 2. Fetch from yfinance
    quote = await yf_fetcher.get_quote(symbol)
    if not quote:
        return None

    # 3. Cache in Redis (5 min for live prices)
    await cache_set(cache_key, quote, ttl=settings.REDIS_MARKET_DATA_TTL)
    return quote


async def get_stock_profile(symbol: str, db: AsyncSession) -> Optional[Dict[str, Any]]:
    """Get full stock profile — Redis → DB → yfinance."""
    cache_key = CacheKeys.stock_profile(symbol)

    # 1. Redis cache
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # 2. Fetch from yfinance
    profile = await yf_fetcher.get_profile(symbol)
    if not profile:
        return None

    # 3. Get or upsert stock in DB
    await upsert_stock(symbol, profile, db)

    # 4. Get technicals
    technicals = await yf_fetcher.get_technicals(symbol)
    if technicals:
        profile["technicals"] = technicals

    # 5. Cache in Redis (1 hour for full profiles)
    await cache_set(cache_key, profile, ttl=3600)
    return profile


async def get_stock_history(
    symbol: str, period: str = "1y", interval: str = "1d"
) -> List[Dict[str, Any]]:
    """Get OHLCV history with Redis caching."""
    cache_key = CacheKeys.stock_history(symbol, period)

    cached = await cache_get(cache_key)
    if cached:
        return cached

    history = await yf_fetcher.get_history(symbol, period=period, interval=interval)

    # Cache daily data for 1 hour; intraday for 5 min
    ttl = 3600 if interval == "1d" else 300
    await cache_set(cache_key, history, ttl=ttl)
    return history


async def get_stock_technicals(symbol: str) -> Optional[Dict[str, Any]]:
    """Get technical indicators with Redis caching."""
    cache_key = CacheKeys.stock_technicals(symbol)

    cached = await cache_get(cache_key)
    if cached:
        return cached

    technicals = await yf_fetcher.get_technicals(symbol)
    if technicals:
        await cache_set(cache_key, technicals, ttl=300)  # 5 min
    return technicals


async def search_stocks(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search stocks by name/symbol."""
    if len(query.strip()) < 1:
        return []
    results = yf_fetcher.search_stocks(query, limit=limit)
    return results


async def upsert_stock(
    symbol: str, profile: Dict[str, Any], db: AsyncSession
) -> Stock:
    """Insert or update stock record in DB."""
    try:
        result = await db.execute(select(Stock).where(Stock.symbol == symbol))
        stock = result.scalar_one_or_none()

        fundamentals = profile.get("fundamentals", {})

        if stock is None:
            stock = Stock(
                symbol=symbol,
                exchange=profile.get("exchange", "NSE"),
                name=profile.get("name", symbol),
                sector=profile.get("sector"),
                industry=profile.get("industry"),
                description=profile.get("description"),
                market_cap=profile.get("market_cap"),
                cached_fundamentals=fundamentals,
                fundamentals_cached_at=datetime.now(timezone.utc),
                last_price=profile.get("price"),
                last_price_updated_at=datetime.now(timezone.utc),
            )
            db.add(stock)
        else:
            stock.name = profile.get("name", stock.name)
            stock.sector = profile.get("sector", stock.sector)
            stock.market_cap = profile.get("market_cap", stock.market_cap)
            stock.cached_fundamentals = fundamentals
            stock.fundamentals_cached_at = datetime.now(timezone.utc)
            stock.last_price = profile.get("price")
            stock.last_price_updated_at = datetime.now(timezone.utc)

        await db.flush()
        return stock
    except Exception as e:
        logger.error("Stock upsert failed for %s: %s", symbol, e)
        raise


async def get_market_indices() -> Dict[str, Any]:
    """Get major Indian market indices."""
    cache_key = CacheKeys.market_indices()
    cached = await cache_get(cache_key)
    if cached:
        return cached

    indices = {
        "^NSEI": "Nifty 50",
        "^BSESN": "Sensex",
        "^NSMIDCP": "Nifty Midcap 150",
        "^CNXSMALLCAP": "Nifty Smallcap 100",
        "^CNXBANK": "Nifty Bank",
        "^CNXIT": "Nifty IT",
        "^CNXPHARMA": "Nifty Pharma",
    }

    results = {}
    for ticker_symbol, name in indices.items():
        quote = await yf_fetcher.get_quote(ticker_symbol)
        if quote:
            results[ticker_symbol] = {"name": name, **quote}

    await cache_set(cache_key, results, ttl=300)  # 5 min
    return results
