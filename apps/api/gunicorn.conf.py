# ════════════════════════════════════════════════════════════════════════════════
# gunicorn.conf.py  —  Production Gunicorn config for Render
# Render uses the PORT env var (default: 10000)
# ════════════════════════════════════════════════════════════════════════════════
import os
import multiprocessing

# ── Binding ───────────────────────────────────────────────────────────────────
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# ── Workers ───────────────────────────────────────────────────────────────────
# Render starter plan: 512MB RAM, 0.5 CPU
# Formula: (2 × cpu_count) + 1  →  capped at 2 for starter plan
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
threads = 1   # UvicornWorker is async — threads not relevant

# ── Timeouts ──────────────────────────────────────────────────────────────────
timeout = 120         # Allow yfinance & AI calls up to 2 min
graceful_timeout = 30
keepalive = 5

# ── Memory management (prevent leaks on Render free plan) ─────────────────────
max_requests = 500          # Restart worker after N requests
max_requests_jitter = 50    # Add jitter to avoid thundering herd

# ── Logging ───────────────────────────────────────────────────────────────────
# Render captures stdout/stderr — use "-" to write to stdout
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sµs'

# ── Performance ───────────────────────────────────────────────────────────────
preload_app = True    # Load app before forking — reduces per-worker memory

# ── Server mechanics ──────────────────────────────────────────────────────────
worker_tmp_dir = "/dev/shm"  # Use shared memory for faster tmp ops on Linux

# ── Hooks for startup logging ─────────────────────────────────────────────────
def on_starting(server):
    server.log.info("🚀 TraderAI API starting on %s (%d workers)", bind, workers)

def post_worker_init(worker):
    worker.log.info("✅ Worker %s ready", worker.pid)

def worker_exit(server, worker):
    server.log.info("🛑 Worker %s exiting", worker.pid)
