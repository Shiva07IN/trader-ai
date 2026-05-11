"""
Celery Application — Background task queue
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "traderai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.ai_tasks", "app.workers.market_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_routes={
        "app.workers.ai_tasks.*": {"queue": "ai_tasks"},
        "app.workers.market_tasks.*": {"queue": "market_tasks"},
    },
    # ── Beat schedule (periodic tasks) ────────────────────────────────────────
    beat_schedule={
        # Refresh top-50 stock prices every 5 minutes during market hours
        "refresh-top-stocks": {
            "task": "app.workers.market_tasks.refresh_top_stocks",
            "schedule": crontab(minute="*/5", hour="9-15", day_of_week="mon-fri"),
        },
        # Refresh market indices every minute during market hours
        "refresh-indices": {
            "task": "app.workers.market_tasks.refresh_indices",
            "schedule": crontab(minute="*/1", hour="9-15", day_of_week="mon-fri"),
        },
    },
    # ── Limits ────────────────────────────────────────────────────────────────
    task_soft_time_limit=60,   # 60 second soft limit
    task_time_limit=120,       # 2 minute hard limit
    worker_max_tasks_per_child=100,
)
