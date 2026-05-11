"""
Pydantic Schemas — Portfolio
"""
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class PortfolioGenerateRequest(BaseModel):
    investment_amount: Decimal = Field(gt=1000, description="Minimum ₹1,000")
    sip_amount: Optional[Decimal] = Field(None, ge=0)
    risk_tolerance: str = Field(pattern="^(low|medium|high)$")
    investment_horizon: str = Field(
        pattern="^(short_term|medium_term|long_term)$",
        description="short_term: <1yr | medium_term: 1-5yr | long_term: >5yr",
    )
    preferred_sectors: List[str] = Field(default=[], max_length=10)
    age: Optional[int] = Field(None, ge=18, le=100)
    goals: Optional[str] = Field(None, max_length=500)
    name: str = Field(default="AI Portfolio", max_length=100)


class PortfolioHolding(BaseModel):
    symbol: str
    name: str
    sector: str
    allocation_pct: float = Field(ge=0, le=100)
    amount_inr: float
    reasoning: str
    risk_level: str
    expected_cagr: float
    time_horizon: str


class PortfolioResponse(BaseModel):
    id: str
    name: str
    investment_amount: float
    risk_tolerance: str
    investment_horizon: str
    holdings: List[PortfolioHolding]
    ai_summary: Optional[str]
    expected_cagr: Optional[float]
    risk_profile: Optional[str]
    generation_status: str
    created_at: str

    model_config = {"from_attributes": True}


class PortfolioTaskResponse(BaseModel):
    task_id: str
    portfolio_id: str
    status: str  # pending | generating | completed | failed
    message: str
