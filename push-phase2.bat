@echo off
echo Staging Phase 2 changes...
git add apps/api/app/api/v1/routers/screener.py
git add apps/api/app/api/v1/routers/news.py
git add apps/api/app/api/v1/routers/auth.py
git add apps/api/app/api/v1/router.py
git add apps/api/app/workers/ai_tasks.py
git add apps/web/app/register/page.tsx
git add "apps/web/app/(dashboard)/stocks"
git add "apps/web/app/(dashboard)/insights/page.tsx"
git add "apps/web/app/(dashboard)/watchlist/page.tsx"
git add "apps/web/app/(dashboard)/screener/page.tsx"
git add "apps/web/app/(dashboard)/news/page.tsx"
git add "apps/web/app/(dashboard)/settings/page.tsx"
git add apps/web/components/charts/price-chart.tsx
git add apps/web/components/charts/technical-chart.tsx
git add apps/web/components/stock/swot-grid.tsx
git add apps/web/components/stock/fundamentals-table.tsx
git add apps/web/lib/api.ts
git add apps/web/lib/utils.ts
git add .gitattributes

echo Committing...
git commit -m "feat(phase2): complete Phase 2 - 7 pages + AI chat + candlestick charts + screener + news API

Frontend pages:
- /register - sign-up with password strength meter
- /dashboard/stocks/[symbol] - full stock detail (candlestick + SWOT + technicals + fundamentals)
- /dashboard/insights - AI chat UI with quick prompts + history
- /dashboard/watchlist - live watchlist with real-time quotes
- /dashboard/screener - stock screener with sector/PE/ROE filters
- /dashboard/news - aggregated news with AI sentiment detection
- /dashboard/settings - risk tolerance, horizon, sector preferences

Components:
- price-chart.tsx - TradingView-style candlestick (lightweight-charts)
- technical-chart.tsx - RSI gauge + MACD histogram + BB bands
- swot-grid.tsx - 4-quadrant SWOT analysis display
- fundamentals-table.tsx - key ratios with good/average/weak badges

Backend:
- GET /screener - instant filter from 50-stock pre-seeded fundamentals
- GET /news - RSS aggregation from ET/Moneycontrol/Mint/BS with sentiment
- PATCH /auth/me - update user profile preferences
- ai_tasks.py - Celery async portfolio generation task"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Done! View at: https://github.com/Shiva07IN/trader-ai
