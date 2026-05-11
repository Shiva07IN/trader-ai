"""
AI Router — Stock analysis, chat, and market insights
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_auth
from app.services import ai_service, stock_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class StockAnalysisRequest(BaseModel):
    symbol: str


@router.post("/analyze/{symbol}")
@limiter.limit("5/minute")
async def analyze_stock(
    request: Request,
    symbol: str,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate full AI analysis for a stock: SWOT, investment thesis, risk rating.
    Requires authentication. Rate-limited to 5/minute.
    """
    # Fetch stock profile first
    profile = await stock_service.get_stock_profile(symbol.upper(), db)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")

    try:
        analysis = await ai_service.analyze_stock(
            symbol=symbol.upper(),
            company_name=profile.get("name", symbol),
            profile_data=profile,
        )
        return {
            "symbol": symbol.upper(),
            "company_name": profile.get("name"),
            "analysis": analysis,
            "disclaimer": (
                "⚠️ AI-generated analysis for educational purposes only. "
                "Not investment advice. Consult a SEBI-registered adviser."
            ),
        }
    except Exception as e:
        logger.error("Stock analysis failed for %s: %s", symbol, e)
        raise HTTPException(status_code=503, detail="AI analysis temporarily unavailable")


@router.post("/chat")
@limiter.limit("30/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    user_id: str = Depends(require_auth),
):
    """
    AI financial assistant chat.
    Maintains conversation context via history array.
    """
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history = [{"role": m.role, "content": m.content} for m in (body.history or [])]

    response = await ai_service.chat(
        message=body.message,
        conversation_history=history,
    )

    return {
        "response": response,
        "role": "assistant",
    }


@router.get("/market-insight")
@limiter.limit("10/minute")
async def market_insight(request: Request):
    """
    Get AI-generated market intelligence summary.
    Public endpoint (no auth required).
    """
    # For MVP, return a static insight with dynamic market data context
    insight = await ai_service.chat(
        message=(
            "Give me a brief 3-paragraph overview of the current Indian stock market "
            "conditions, key themes for investors to watch, and sectors that look "
            "interesting right now. Keep it concise and actionable."
        ),
        conversation_history=[],
    )
    return {
        "insight": insight,
        "disclaimer": "AI-generated for educational purposes only. Not investment advice.",
    }
