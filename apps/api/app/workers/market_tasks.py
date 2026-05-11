"""
Market Tasks — Celery background jobs for market data refresh
"""
import asyncio
import logging
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

TOP_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
    "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "WIPRO.NS",
    "SUNPHARMA.NS", "TITAN.NS", "BAJFINANCE.NS", "ULTRACEMCO.NS", "NESTLEIND.NS",
]


@celery_app.task(name="app.workers.market_tasks.refresh_top_stocks", queue="market_tasks")
def refresh_top_stocks():
    """Refresh prices for top 20 stocks — runs every 5 min during market hours."""
    from app.core.cache import cache_set, CacheKeys
    from app.data.fetchers.yfinance_fetcher import get_quote

    async def _refresh():
        for symbol in TOP_STOCKS:
            try:
                quote = await get_quote(symbol)
                if quote:
                    await cache_set(CacheKeys.stock_quote(symbol), quote, ttl=300)
                    logger.debug("Refreshed: %s @ ₹%s", symbol, quote.get("price"))
            except Exception as e:
                logger.error("Failed to refresh %s: %s", symbol, e)

    asyncio.run(_refresh())
    logger.info("Top stocks refresh complete")


@celery_app.task(name="app.workers.market_tasks.refresh_indices", queue="market_tasks")
def refresh_indices():
    """Refresh market indices every minute."""
    from app.core.cache import cache_set, CacheKeys
    from app.data.fetchers.yfinance_fetcher import get_quote

    INDICES = ["^NSEI", "^BSESN", "^CNXBANK", "^CNXIT", "^NSMIDCP"]

    async def _refresh():
        results = {}
        for symbol in INDICES:
            try:
                quote = await get_quote(symbol)
                if quote:
                    results[symbol] = quote
            except Exception as e:
                logger.error("Failed to refresh index %s: %s", symbol, e)
        if results:
            await cache_set(CacheKeys.market_indices(), results, ttl=60)

    asyncio.run(_refresh())
