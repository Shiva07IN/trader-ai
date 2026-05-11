"""
Application Configuration — Pydantic Settings
All values loaded from environment variables with sane defaults.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "TraderAI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "changeme-in-production-use-32-chars-min"

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://traderai:traderai_secret@localhost:5432/traderai_db"
    DATABASE_URL_SYNC: str = "postgresql://traderai:traderai_secret@localhost:5432/traderai_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://:redis_secret@localhost:6379/0"
    REDIS_CACHE_TTL: int = 300          # 5 minutes default
    REDIS_MARKET_DATA_TTL: int = 300    # 5 min for live quotes
    REDIS_FUNDAMENTAL_TTL: int = 86400  # 24 hrs for fundamentals

    # ── ChromaDB ──────────────────────────────────────────────────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "changeme-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── OpenRouter (OpenAI-compatible) ────────────────────────────────────────
    # Get your free key at: https://openrouter.ai/keys
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemma-3-27b-it:free"
    OPENROUTER_EMBEDDING_MODEL: str = "text-embedding-3-small"  # fallback
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TEMPERATURE: float = 0.3

    # Alias — LangChain ChatOpenAI reads OPENAI_API_KEY from env automatically;
    # we override it at runtime via get_llm() so this is just a safety fallback.
    OPENAI_API_KEY: str = ""  # Leave blank — use OPENROUTER_API_KEY

    @property
    def active_api_key(self) -> str:
        """Returns whichever key is configured (OpenRouter takes priority)."""
        return self.OPENROUTER_API_KEY or self.OPENAI_API_KEY

    # ── External APIs ─────────────────────────────────────────────────────────
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    FINNHUB_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://traderai.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    # ── Rate Limits ───────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AI_PER_MINUTE: int = 5

    # ── Celery ────────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://:redis_secret@localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://:redis_secret@localhost:6379/2"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
