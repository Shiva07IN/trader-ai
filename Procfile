web: gunicorn app.main:app -c gunicorn.conf.py
worker: celery -A app.workers.celery_app worker --loglevel=info --concurrency=1 -Q ai_tasks,market_tasks
beat: celery -A app.workers.celery_app beat --loglevel=info
