"""
Market Router — Indices, FII/DII, and market overview
"""
from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services import stock_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/indices")
@limiter.limit("60/minute")
async def get_market_indices(request: Request):
    """Get major Indian market indices: Nifty 50, Sensex, Bank Nifty, IT, etc."""
    indices = await stock_service.get_market_indices()
    return {"indices": indices}


@router.get("/overview")
@limiter.limit("30/minute")
async def market_overview(request: Request):
    """
    Get a market overview: indices + top gainers/losers context.
    MVP: Returns indices data with simplified context.
    """
    indices = await stock_service.get_market_indices()
    nifty = indices.get("^NSEI", {})

    return {
        "indices": indices,
        "market_status": "open" if nifty else "unknown",
        "last_updated": nifty.get("fetched_at"),
    }


"""
Watchlist Router — User stock watchlists
"""
import uuid
from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.security import require_auth
from app.models.watchlist import Watchlist

watchlist_router = APIRouter()


class AddSymbolRequest(BaseModel):
    symbol: str
    buy_price: Optional[float] = None
    notes: Optional[str] = None


@watchlist_router.get("")
async def get_watchlist(
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get user's default watchlist."""
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.user_id == uuid.UUID(user_id),
            Watchlist.is_default == True,
        )
    )
    watchlist = result.scalar_one_or_none()

    if not watchlist:
        # Auto-create default watchlist
        watchlist = Watchlist(
            user_id=uuid.UUID(user_id),
            name="My Watchlist",
            is_default=True,
            symbols=[],
        )
        db.add(watchlist)
        await db.flush()

    return {
        "id": str(watchlist.id),
        "name": watchlist.name,
        "symbols": watchlist.symbols,
    }


@watchlist_router.post("/add")
async def add_to_watchlist(
    body: AddSymbolRequest,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Add a stock to watchlist."""
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.user_id == uuid.UUID(user_id),
            Watchlist.is_default == True,
        )
    )
    watchlist = result.scalar_one_or_none()

    if not watchlist:
        watchlist = Watchlist(
            user_id=uuid.UUID(user_id),
            name="My Watchlist",
            is_default=True,
            symbols=[],
        )
        db.add(watchlist)
        await db.flush()

    symbols = list(watchlist.symbols or [])
    symbol = body.symbol.upper()
    if not symbol.endswith((".NS", ".BO")):
        symbol += ".NS"

    # Check if already exists
    if any(s.get("symbol") == symbol for s in symbols):
        raise HTTPException(status_code=409, detail="Stock already in watchlist")

    from datetime import datetime, timezone
    symbols.append({
        "symbol": symbol,
        "added_at": datetime.now(timezone.utc).isoformat(),
        "buy_price": body.buy_price,
        "notes": body.notes,
    })
    watchlist.symbols = symbols
    return {"message": f"{symbol} added to watchlist", "symbols": symbols}


@watchlist_router.delete("/remove/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Remove a stock from watchlist."""
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.user_id == uuid.UUID(user_id),
            Watchlist.is_default == True,
        )
    )
    watchlist = result.scalar_one_or_none()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    symbol = symbol.upper()
    symbols = [s for s in (watchlist.symbols or []) if s.get("symbol") != symbol]
    watchlist.symbols = symbols
    return {"message": f"{symbol} removed", "symbols": symbols}
