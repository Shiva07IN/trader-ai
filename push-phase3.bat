@echo off
echo === TraderAI Phase 3 — Staging all changes ===
git add apps/web/app/(dashboard)/tools/page.tsx
git add apps/web/app/(dashboard)/market/page.tsx
git add apps/web/app/(dashboard)/compare/page.tsx
git add apps/web/app/(dashboard)/alerts/page.tsx
git add "apps/web/app/(dashboard)/portfolio/[id]/page.tsx"
git add apps/web/components/layout/sidebar.tsx
git add apps/web/public/manifest.json
git add vercel.json
git add railway.json
git add Procfile
git add .github/workflows/ci.yml
git add push-phase2.bat

echo.
echo === Committing Phase 3 ===
git commit -m "feat(phase3): production-ready - financial tools, market movers, compare, alerts, deployment

Frontend Pages:
- /tools - SIP + Lumpsum + Goal Planner + CAGR calculators with Recharts
- /market - Live indices, sector heatmap (intensity-coded), top gainers/losers
- /compare - Multi-stock overlay chart + color-coded fundamentals comparison table
- /alerts - Price alert management with localStorage persistence
- /portfolio/[id] - Portfolio analytics with sector donut + 5Y growth projection

Sidebar:
- Grouped navigation (Main / Research / Tools & AI) with section labels
- Sign out now wired to NextAuth signOut()
- Collapsible with tooltips in collapsed state

Deployment:
- vercel.json - Frontend config with API proxy + CSP headers
- railway.json - Backend config with health check
- Procfile - Web + Worker + Beat processes
- .github/workflows/ci.yml - GitHub Actions CI (TypeScript + ruff + Docker build)
- apps/web/public/manifest.json - PWA installable manifest"

echo.
echo === Pushing to GitHub ===
git push origin main

echo.
echo Done! View at: https://github.com/Shiva07IN/trader-ai
