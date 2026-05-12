"""
News Router — Aggregates Indian financial news from RSS feeds.
"""
import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from xml.etree import ElementTree

import httpx
from fastapi import APIRouter, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.cache import cache_get, cache_set

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

RSS_FEEDS = [
    {
        "name": "Economic Times Markets",
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "category": "markets",
    },
    {
        "name": "Moneycontrol",
        "url": "https://www.moneycontrol.com/rss/latestnews.xml",
        "category": "general",
    },
    {
        "name": "Mint Markets",
        "url": "https://www.livemint.com/rss/markets",
        "category": "markets",
    },
    {
        "name": "Business Standard Markets",
        "url": "https://www.business-standard.com/rss/markets-106.rss",
        "category": "markets",
    },
]

BULLISH_KEYWORDS = {"gain", "rally", "surge", "jump", "rise", "record", "high", "bull", "growth", "profit", "beat", "strong", "positive", "up", "boost"}
BEARISH_KEYWORDS = {"fall", "drop", "crash", "decline", "loss", "weak", "bear", "down", "sell", "concern", "risk", "low", "slump", "miss", "cut"}


def _detect_sentiment(text: str) -> str:
    words = set(text.lower().split())
    bullish = len(words & BULLISH_KEYWORDS)
    bearish = len(words & BEARISH_KEYWORDS)
    if bullish > bearish:
        return "bullish"
    elif bearish > bullish:
        return "bearish"
    return "neutral"


def _clean_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


async def _fetch_rss(feed: Dict[str, str], client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """Fetch and parse a single RSS feed."""
    try:
        resp = await client.get(feed["url"], timeout=8.0)
        resp.raise_for_status()
        root = ElementTree.fromstring(resp.content)
        channel = root.find("channel")
        if channel is None:
            return []

        articles = []
        for item in channel.findall("item")[:8]:
            title = _clean_html(item.findtext("title", ""))
            desc = _clean_html(item.findtext("description", ""))
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")

            if not title:
                continue

            articles.append({
                "title": title,
                "description": desc[:200] if desc else "",
                "url": link,
                "source": feed["name"],
                "category": feed["category"],
                "sentiment": _detect_sentiment(title + " " + desc),
                "published_at": pub_date,
            })
        return articles
    except Exception as e:
        logger.warning("RSS feed failed (%s): %s", feed["name"], e)
        return []


async def _aggregate_news() -> List[Dict[str, Any]]:
    """Fetch all RSS feeds concurrently."""
    cache_key = "news:aggregated"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(headers={"User-Agent": "TraderAI/1.0 NewsBot"}) as client:
        tasks = [_fetch_rss(feed, client) for feed in RSS_FEEDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    articles = []
    for result in results:
        if isinstance(result, list):
            articles.extend(result)

    # Sort by source diversity (interleave sources)
    seen_sources: Dict[str, int] = {}
    interleaved = []
    remaining = list(articles)
    while remaining:
        for source in [f["name"] for f in RSS_FEEDS]:
            for i, art in enumerate(remaining):
                if art["source"] == source:
                    interleaved.append(remaining.pop(i))
                    break

    final = interleaved if interleaved else articles

    # Cache for 15 minutes
    await cache_set(cache_key, final, ttl=900)
    return final


@router.get("")
@limiter.limit("30/minute")
async def get_news(
    request: Request,
    category: Optional[str] = Query(None, description="markets|general"),
    sentiment: Optional[str] = Query(None, description="bullish|bearish|neutral"),
    limit: int = Query(default=20, ge=1, le=50),
):
    """Get aggregated Indian financial news from multiple sources."""
    articles = await _aggregate_news()

    if category:
        articles = [a for a in articles if a.get("category") == category]
    if sentiment:
        articles = [a for a in articles if a.get("sentiment") == sentiment]

    return {
        "articles": articles[:limit],
        "total": len(articles),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
