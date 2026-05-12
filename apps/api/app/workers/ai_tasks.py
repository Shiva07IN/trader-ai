"""
AI Background Tasks — Celery async AI generation
"""
import asyncio
import logging
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.workers.ai_tasks.generate_portfolio_async",
    queue="ai_tasks",
    bind=True,
    max_retries=2,
)
def generate_portfolio_async(
    self,
    portfolio_id: str,
    investment_amount: float,
    sip_amount: float,
    risk_tolerance: str,
    investment_horizon: str,
    preferred_sectors: list,
    age: int,
    goals: str,
):
    """
    Async Celery task for portfolio generation.
    Called by portfolio router in production to avoid blocking.
    """
    from app.services import ai_service
    from app.core.database import AsyncSessionLocal
    from app.models.portfolio import Portfolio
    import uuid
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            try:
                result = await ai_service.generate_portfolio(
                    investment_amount=investment_amount,
                    sip_amount=sip_amount,
                    risk_tolerance=risk_tolerance,
                    investment_horizon=investment_horizon,
                    preferred_sectors=preferred_sectors,
                    age=age,
                    goals=goals,
                )

                # Update portfolio record
                pid = uuid.UUID(portfolio_id)
                query = await db.execute(select(Portfolio).where(Portfolio.id == pid))
                portfolio = query.scalar_one_or_none()
                if portfolio:
                    portfolio.holdings = result.get("holdings", [])
                    portfolio.ai_summary = result.get("portfolio_summary", "")
                    portfolio.expected_cagr = result.get("expected_cagr")
                    portfolio.risk_profile = result.get("risk_profile")
                    portfolio.generation_status = "completed"
                    portfolio.ai_model_used = "openrouter"
                    await db.commit()

                logger.info("Portfolio %s generated successfully", portfolio_id)
            except Exception as e:
                logger.error("Portfolio generation failed: %s", e)
                # Mark as failed
                async with AsyncSessionLocal() as db2:
                    pid = uuid.UUID(portfolio_id)
                    q = await db2.execute(select(Portfolio).where(Portfolio.id == pid))
                    p = q.scalar_one_or_none()
                    if p:
                        p.generation_status = "failed"
                        await db2.commit()
                raise self.retry(exc=e, countdown=30)

    asyncio.run(_run())
