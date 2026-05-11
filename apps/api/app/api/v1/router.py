"""API v1 Router — aggregates all sub-routers."""
from fastapi import APIRouter

from app.api.v1.routers import auth, stocks, portfolio, ai, market
from app.api.v1.routers.market import watchlist_router

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(watchlist_router, prefix="/watchlist", tags=["Watchlist"])
api_router.include_router(market.router, prefix="/market", tags=["Market"])
