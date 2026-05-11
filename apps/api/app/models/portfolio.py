"""
Portfolio Model — AI-generated portfolio recommendations
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    # ── Primary Key ───────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ── Ownership ─────────────────────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Portfolio Metadata ────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="My Portfolio")

    # ── User Input Parameters (stored for reference) ──────────────────────────
    investment_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    sip_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    risk_tolerance: Mapped[str] = mapped_column(String(10), nullable=False)  # low | medium | high
    investment_horizon: Mapped[str] = mapped_column(String(20), nullable=False)
    preferred_sectors: Mapped[list] = mapped_column(JSONB, default=list)
    user_age: Mapped[int | None] = mapped_column(nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── AI Output ─────────────────────────────────────────────────────────────
    holdings: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        # Schema: [{symbol, name, sector, allocation_pct, amount_inr,
        #           reasoning, risk_level, expected_cagr, time_horizon}]
    )
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_cagr: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    risk_profile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ai_model_used: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Status ────────────────────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    generation_status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending | generating | completed | failed

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="portfolios")

    def __repr__(self) -> str:
        return f"<Portfolio id={self.id} user={self.user_id} amount={self.investment_amount}>"
