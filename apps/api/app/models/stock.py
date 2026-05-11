"""
Stock Model — Market data cache and AI analysis storage
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    # ── Primary Key ───────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ── Identity ──────────────────────────────────────────────────────────────
    symbol: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    # e.g. RELIANCE.NS (NSE) or RELIANCE.BO (BSE)
    exchange: Mapped[str] = mapped_column(String(10), nullable=False)  # NSE | BSE
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    isin: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Live Price ────────────────────────────────────────────────────────────
    last_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_change: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    price_change_pct: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    volume: Mapped[int | None] = mapped_column(nullable=True)
    last_price_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Fundamentals (cached from yfinance) ───────────────────────────────────
    market_cap: Mapped[int | None] = mapped_column(nullable=True)
    cached_fundamentals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fundamentals_cached_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Technicals (cached) ───────────────────────────────────────────────────
    cached_technicals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    technicals_cached_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── AI Analysis ───────────────────────────────────────────────────────────
    ai_thesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_swot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_sentiment_score: Mapped[int | None] = mapped_column(nullable=True)  # 0-100
    ai_risk_rating: Mapped[str | None] = mapped_column(String(10), nullable=True)  # low/med/high
    ai_thesis_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Stock symbol={self.symbol} name={self.name}>"
