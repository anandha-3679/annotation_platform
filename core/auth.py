"""
core/auth.py — FastAPI Users configuration, user manager, and auth backend.

Provides:
- UserRead, UserCreate, UserUpdate schemas
- UserManager with token secrets and lifecycle hooks
- JWT authentication backend with Bearer transport
- FastAPIUsers instance and dependency helpers
"""

import uuid
import logging
from typing import Optional, AsyncGenerator
from datetime import datetime

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, schemas
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from models.tables import User
from core.database import get_async_session
from core.config import settings

logger = logging.getLogger(__name__)


# ── 1. Schemas ────────────────────────────────────────────────────────────────
class UserRead(schemas.BaseUser[uuid.UUID]):
    name: Optional[str] = None
    role: str = "annotator"
    created_at: Optional[datetime] = None


class UserCreate(schemas.BaseUserCreate):
    name: Optional[str] = None
    role: Optional[str] = "annotator"


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    role: Optional[str] = None


# ── 2. User Database Adapter ──────────────────────────────────────────────────
async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


# ── 3. User Manager ───────────────────────────────────────────────────────────
class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info("User registered successfully: id=%s, email=%s", user.id, user.email)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info("User %s requested password reset. Token: %s", user.id, token)

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info("Verification requested for user %s. Token: %s", user.id, token)


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


# ── 4. Authentication Backend (JWT + Bearer Transport) ─────────────────────────
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    # 7-day token expiration for clinical workstation sessions
    return JWTStrategy(secret=settings.jwt_secret, lifetime_seconds=3600 * 24 * 7)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


# ── 5. FastAPIUsers Instance & Current User Dependencies ──────────────────────
fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
