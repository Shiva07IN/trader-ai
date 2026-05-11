"""
Portfolio Router — AI-powered portfolio generation and management
"""
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_auth
from app.models.portfolio import Portfolio
from app.schemas.portfolio import (
    PortfolioGenerateRequest,
    PortfolioResponse,
    PortfolioTaskResponse,
)
from app.services import ai_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

SEBI_DISCLAIMER = (
    "⚠️ DISCLAIMER: This AI-generated portfolio is for educational and informational "
    "purposes only. It does not constitute investment advice. Past performance is not "
    "indicative of future results. Please consult a SEBI-registered investment adviser "
    "before making investment decisions."
)


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
async def generate_portfolio(
    request: Request,
    body: PortfolioGenerateRequest,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an AI-powered stock portfolio.
    Returns a portfolio_id immediately; AI generation happens synchronously for MVP
    (async via Celery in production).
    """
    # Create portfolio record in DB with pending status
    portfolio = Portfolio(
        user_id=uuid.UUID(user_id),
        name=body.name,
        investment_amount=body.investment_amount,
        sip_amount=body.sip_amount or 0,
        risk_tolerance=body.risk_tolerance,
        investment_horizon=body.investment_horizon,
        preferred_sectors=body.preferred_sectors,
        user_age=body.age,
        goals=body.goals,
        generation_status="generating",
    )
    db.add(portfolio)
    await db.flush()
    portfolio_id = str(portfolio.id)

    try:
        # Generate portfolio using AI (synchronous for MVP)
        ai_result = await ai_service.generate_portfolio(
            investment_amount=float(body.investment_amount),
            sip_amount=float(body.sip_amount or 0),
            risk_tolerance=body.risk_tolerance,
            investment_horizon=body.investment_horizon,
            preferred_sectors=body.preferred_sectors,
            age=body.age,
            goals=body.goals,
        )

        # Update portfolio with AI results
        portfolio.holdings = ai_result.get("holdings", [])
        portfolio.ai_summary = ai_result.get("portfolio_summary", "") + f"\n\n{SEBI_DISCLAIMER}"
        portfolio.expected_cagr = ai_result.get("expected_cagr")
        portfolio.risk_profile = ai_result.get("risk_profile")
        portfolio.ai_model_used = "gpt-4o-mini"
        portfolio.generation_status = "completed"

        logger.info("Portfolio generated for user %s: %s", user_id, portfolio_id)

        return {
            "portfolio_id": portfolio_id,
            "status": "completed",
            "portfolio": {
                "id": portfolio_id,
                "name": portfolio.name,
                "investment_amount": float(portfolio.investment_amount),
                "risk_tolerance": portfolio.risk_tolerance,
                "investment_horizon": portfolio.investment_horizon,
                "holdings": portfolio.holdings,
                "ai_summary": portfolio.ai_summary,
                "expected_cagr": float(portfolio.expected_cagr) if portfolio.expected_cagr else None,
                "risk_profile": portfolio.risk_profile,
                "generation_status": portfolio.generation_status,
                "created_at": portfolio.created_at.isoformat() if portfolio.created_at else None,
            },
        }

    except Exception as e:
        portfolio.generation_status = "failed"
        logger.error("Portfolio generation failed for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=503,
            detail="AI portfolio generation failed. Please check your OpenAI API key and try again.",
        )


@router.get("", response_model=List[dict])
async def list_portfolios(
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """List all portfolios for the current user."""
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == uuid.UUID(user_id), Portfolio.is_active == True)
        .order_by(Portfolio.created_at.desc())
    )
    portfolios = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "investment_amount": float(p.investment_amount),
            "risk_tolerance": p.risk_tolerance,
            "investment_horizon": p.investment_horizon,
            "holdings_count": len(p.holdings) if p.holdings else 0,
            "expected_cagr": float(p.expected_cagr) if p.expected_cagr else None,
            "generation_status": p.generation_status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in portfolios
    ]


@router.get("/{portfolio_id}")
async def get_portfolio(
    portfolio_id: str,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific portfolio by ID."""
    try:
        pid = uuid.UUID(portfolio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid portfolio ID")

    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == pid,
            Portfolio.user_id == uuid.UUID(user_id),
        )
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return {
        "id": str(portfolio.id),
        "name": portfolio.name,
        "investment_amount": float(portfolio.investment_amount),
        "sip_amount": float(portfolio.sip_amount) if portfolio.sip_amount else None,
        "risk_tolerance": portfolio.risk_tolerance,
        "investment_horizon": portfolio.investment_horizon,
        "preferred_sectors": portfolio.preferred_sectors,
        "holdings": portfolio.holdings,
        "ai_summary": portfolio.ai_summary,
        "expected_cagr": float(portfolio.expected_cagr) if portfolio.expected_cagr else None,
        "risk_profile": portfolio.risk_profile,
        "generation_status": portfolio.generation_status,
        "created_at": portfolio.created_at.isoformat() if portfolio.created_at else None,
    }


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: str,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a portfolio."""
    try:
        pid = uuid.UUID(portfolio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid portfolio ID")

    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == pid,
            Portfolio.user_id == uuid.UUID(user_id),
        )
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio.is_active = False
