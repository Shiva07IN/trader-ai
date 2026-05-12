"""
Auth Router — Register, Login, Refresh, Me
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    require_auth,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with email/password."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        provider="email",
    )
    db.add(user)
    await db.flush()

    user_id = str(user.id)
    access_token = create_access_token({"sub": user_id, "email": body.email})
    refresh_token = create_refresh_token({"sub": user_id})

    logger.info("New user registered: %s", body.email)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=900,  # 15 minutes
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email/password."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    user_id = str(user.id)
    access_token = create_access_token({"sub": user_id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user_id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=900,
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh_token(
    request: Request,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token required")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access = create_access_token({"sub": user_id, "email": user.email})
    new_refresh = create_refresh_token({"sub": user_id})

    return TokenResponse(access_token=new_access, refresh_token=new_refresh, expires_in=900)


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user profile."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        subscription_tier=user.subscription_tier,
        risk_tolerance=user.risk_tolerance,
        investment_horizon=user.investment_horizon,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat(),
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: dict,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile preferences."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "name" in body and body["name"]:
        user.name = body["name"]
    if "risk_tolerance" in body:
        user.risk_tolerance = body["risk_tolerance"]
    if "investment_horizon" in body:
        user.investment_horizon = body["investment_horizon"]
    if "preferred_sectors" in body:
        user.preferred_sectors = body["preferred_sectors"]

    await db.flush()
    logger.info("User %s updated profile", user_id)

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        subscription_tier=user.subscription_tier,
        risk_tolerance=user.risk_tolerance,
        investment_horizon=user.investment_horizon,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat(),
    )
