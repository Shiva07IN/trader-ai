"""
Redis Cache Client — async wrapper with typed helpers
"""
import json
import logging
from typing import Any, Optional, Union

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

# Module-level client (initialized on startup)
_redis: Optional[aioredis.Redis] = None


async def init_redis() -> None:
    global _redis
    _redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        max_connections=20,
    )
    await _redis.ping()
    logger.info("✅ Redis connected: %s", settings.REDIS_URL.split("@")[-1])


async def close_redis() -> None:
    global _redis
    if _redis:
        await _redis.aclose()
        logger.info("Redis connection closed")


def get_redis() -> aioredis.Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis


# ─── Typed Cache Helpers ──────────────────────────────────────────────────────

async def cache_get(key: str) -> Optional[Any]:
    """Get a JSON-decoded value from Redis."""
    client = get_redis()
    value = await client.get(key)
    if value is None:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return value


async def cache_set(key: str, value: Any, ttl: int = settings.REDIS_CACHE_TTL) -> None:
    """Set a JSON-encoded value in Redis with TTL."""
    client = get_redis()
    serialized = json.dumps(value, default=str)
    await client.setex(key, ttl, serialized)


async def cache_delete(key: str) -> None:
    client = get_redis()
    await client.delete(key)


async def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern. Returns count deleted."""
    client = get_redis()
    keys = await client.keys(pattern)
    if keys:
        return await client.delete(*keys)
    return 0


# ─── Key Builders ─────────────────────────────────────────────────────────────
class CacheKeys:
    @staticmethod
    def stock_quote(symbol: str) -> str:
        return f"stock:quote:{symbol.upper()}"

    @staticmethod
    def stock_profile(symbol: str) -> str:
        return f"stock:profile:{symbol.upper()}"

    @staticmethod
    def stock_history(symbol: str, period: str) -> str:
        return f"stock:history:{symbol.upper()}:{period}"

    @staticmethod
    def stock_technicals(symbol: str) -> str:
        return f"stock:technicals:{symbol.upper()}"

    @staticmethod
    def stock_fundamentals(symbol: str) -> str:
        return f"stock:fundamentals:{symbol.upper()}"

    @staticmethod
    def market_indices() -> str:
        return "market:indices"

    @staticmethod
    def market_sentiment() -> str:
        return "market:sentiment"

    @staticmethod
    def news_feed(category: str = "general") -> str:
        return f"news:{category}"

    @staticmethod
    def portfolio_task(task_id: str) -> str:
        return f"task:portfolio:{task_id}"

    @staticmethod
    def user_session(user_id: str) -> str:
        return f"session:{user_id}"
