@echo off
echo === TraderAI — Committing Stitch Design System Overhaul ===

git add apps/web/app/globals.css
git add apps/web/app/layout.tsx
git add apps/web/app/page.tsx
git add apps/web/app/login/page.tsx
git add apps/web/app/register/page.tsx
git add "apps/web/app/(dashboard)/layout.tsx"
git add "apps/web/app/(dashboard)/page.tsx"
git add "apps/web/app/(dashboard)/dashboard/page.tsx"
git add "apps/web/app/(dashboard)/screener/page.tsx"
git add "apps/web/app/(dashboard)/insights/page.tsx"
git add "apps/web/app/(dashboard)/compare/page.tsx"
git add "apps/web/app/(dashboard)/alerts/page.tsx"
git add "apps/web/app/(dashboard)/tools/page.tsx"
git add "apps/web/app/(dashboard)/market/page.tsx"
git add "apps/web/app/(dashboard)/portfolio/[id]/page.tsx"
git add apps/web/components/layout/sidebar.tsx
git add vercel.json railway.json Procfile .github/

echo.
echo === Committing ===
git commit -m "design: overhaul with Stitch High-Performance Intelligence design system

Visual Overhaul:
- globals.css: full Stitch design token system (colors, typography, spacing, components)
- Landing page: hero, features, pricing, testimonials, CTA, footer
- Login/Register: split-panel auth with product preview, Google OAuth, password strength
- Dashboard layout: sticky topbar with search, index chips, user avatar
- Sidebar: grouped navigation (Main/Research/Tools & AI), collapsible
- Dashboard: 4-column index cards, portfolio area chart, trending scroll, sector heatmap
- AI Insights: streaming chat UI, stock cards, suggested prompts, markdown render
- Screener: Bloomberg-style sortable table, filter sidebar with sliders

Design System (Stitch 'High-Performance Intelligence'):
- Background: #13121B deep navy-black
- Accent: #4F46E5 indigo
- Typography: Inter + JetBrains Mono for financial data
- Card style: tonal layering, 1px borders, hover glow on indigo
- Color semantics: emerald=positive, red=negative, amber=warning only"

echo.
echo === Pushing to GitHub ===
git push origin main

echo.
echo Done! All Stitch designs deployed.
