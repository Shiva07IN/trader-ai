@echo off
echo ====================================================
echo TraderAI - Starting Development Servers
echo ====================================================

echo.
echo [1/2] Starting Next.js Frontend (port 3000)...
start "TraderAI Frontend" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo.
echo [2/2] Starting FastAPI Backend (port 8000)...
start "TraderAI Backend" cmd /k "cd /d %~dp0apps\api && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ====================================================
echo Services starting...
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ====================================================
