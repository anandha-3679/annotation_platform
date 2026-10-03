from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from core.config import settings
from core.database import check_db_connection, async_session_maker
from core.auth import (
    fastapi_users,
    auth_backend,
    UserRead,
    UserCreate,
    UserUpdate,
    UserManager,
    get_user_db,
)
from fastapi_users.exceptions import UserAlreadyExists
from api.projects import router as projects_router
from api.images import router as images_router
from api.predict import router as predict_router
from api.annotations import router as annotations_router
from api.review import router as review_router
from api.progress import router as progress_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


async def seed_demo_user():
    """Ensure default radiologist demo user exists for 1-click test login."""
    try:
        async with async_session_maker() as session:
            user_db_gen = get_user_db(session)
            user_db = await anext(user_db_gen)
            user_manager = UserManager(user_db)
            try:
                await user_manager.create(
                    UserCreate(
                        email="radiologist@medora.health",
                        password="demo-password-123",
                        name="Dr. Anandha Lakshmi",
                        role="annotator",
                        is_active=True,
                        is_superuser=True,
                        is_verified=True,
                    )
                )
                logger.info("Created default demo user: radiologist@medora.health")
            except UserAlreadyExists:
                logger.info("Default demo user already exists.")
    except Exception as e:
        logger.warning("Could not seed demo user: %s", e)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("MEDORA API starting — environment: %s", settings.environment)
    db_ok = check_db_connection()
    if db_ok:
        logger.info("✅ Database connection: OK")
        await seed_demo_user()
    else:
        logger.warning("⚠️  Database connection FAILED — check DATABASE_URL in .env")
    yield
    # Shutdown
    logger.info("MEDORA API shutting down")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MEDORA API",
    description="AI-assisted chest X-ray annotation platform — backend API with FastAPI Users auth.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────
# In production: restrict to your Vercel frontend URL only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── FastAPI Users Prebuilt Routers ────────────────────────────────────────────
# 1. Login & Logout: POST /auth/jwt/login, POST /auth/jwt/logout
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

# 2. Register: POST /auth/register
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

# 3. Users (/users/me, GET/PATCH /users/{id}): GET /users/me, PATCH /users/me
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# ── Application Routers ───────────────────────────────────────────────────────
app.include_router(projects_router)
app.include_router(images_router)
app.include_router(predict_router)
app.include_router(annotations_router)
app.include_router(review_router)
app.include_router(progress_router)

# ── Health endpoint ───────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    """
    Liveness check. Returns:
      - status: "ok" if everything is healthy
      - db: "connected" | "error"
      - environment: current environment name
    Frontend pings this on startup to confirm the backend is reachable.
    """
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "error",
        "environment": settings.environment,
        "version": "0.1.0",
    }


