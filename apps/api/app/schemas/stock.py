"""
Pydantic Schemas — Stock
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class StockQuote(BaseModel):
    symbol: str
    name: str
    exchange: str
    price: float
    change: float
    change_pct: float
    volume: Optional[int]
    market_cap: Optional[int]
    day_high: Optional[float]
    day_low: Optional[float]
    week_52_high: Optional[float]
    week_52_low: Optional[float]


class StockFundamentals(BaseModel):
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    eps: Optional[float]
    roe: Optional[float]
    roce: Optional[float]
    debt_to_equity: Optional[float]
    current_ratio: Optional[float]
    dividend_yield: Optional[float]
    revenue_growth_yoy: Optional[float]
    earnings_growth_yoy: Optional[float]
    profit_margin: Optional[float]
    market_cap: Optional[int]
    book_value: Optional[float]
    face_value: Optional[float]


class TechnicalIndicators(BaseModel):
    rsi_14: Optional[float]
    macd: Optional[float]
    macd_signal: Optional[float]
    macd_histogram: Optional[float]
    sma_20: Optional[float]
    sma_50: Optional[float]
    sma_200: Optional[float]
    ema_20: Optional[float]
    bb_upper: Optional[float]
    bb_middle: Optional[float]
    bb_lower: Optional[float]
    support_levels: List[float] = []
    resistance_levels: List[float] = []
    trend: Optional[str]  # bullish | bearish | sideways
    signal: Optional[str]  # buy | sell | hold


class OHLCVBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockProfileResponse(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: Optional[str]
    industry: Optional[str]
    description: Optional[str]
    quote: StockQuote
    fundamentals: Optional[StockFundamentals]
    technicals: Optional[TechnicalIndicators]
    ai_thesis: Optional[str]
    ai_swot: Optional[Dict[str, Any]]
    ai_sentiment_score: Optional[int]


class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: Optional[str]
    price: Optional[float]
    change_pct: Optional[float]
