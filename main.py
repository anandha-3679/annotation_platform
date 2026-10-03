import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
from models.tables import Project, Image, Prediction, User
from sqlalchemy import select, func
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


async def seed_initial_cohorts():
    """Ensure starter projects and sample radiographs exist for clinical workflow."""
    try:
        async with async_session_maker() as session:
            # Check if any projects exist
            proj_count_res = await session.execute(select(func.count(Project.id)))
            count = proj_count_res.scalar() or 0
            if count > 0:
                return

            # Find demo user
            user_res = await session.execute(select(User).where(User.email == "radiologist@medora.health"))
            user = user_res.scalars().first()
            if not user:
                return

            # Create starter projects
            p1 = Project(
                name="Chest PA — ICU Cohort",
                description="Acute respiratory distress syndrome & pleural fluid monitoring",
                status="active",
                owner_id=user.id,
            )
            p2 = Project(
                name="Cardiomegaly Pilot",
                description="Cardiothoracic ratio boundary measurement and heart silhouette trial",
                status="active",
                owner_id=user.id,
            )
            p3 = Project(
                name="Pneumothorax Urgents",
                description="Tension pneumothorax line segmentation and urgent pleural air detection",
                status="active",
                owner_id=user.id,
            )
            session.add_all([p1, p2, p3])
            await session.commit()
            await session.refresh(p1)

            # Add starter sample images pointing to raw-images/sample-xray.png
            img1 = Image(
                project_id=p1.id,
                storage_path="raw-images/sample-xray.png",
                original_name="PA_CHEST_ICU_CASE_01.png",
                width_px=1024,
                height_px=1024,
                status="in_review",
                uploaded_by=user.id,
            )
            img2 = Image(
                project_id=p1.id,
                storage_path="raw-images/sample-xray.png",
                original_name="PA_CHEST_ICU_CASE_02.png",
                width_px=1024,
                height_px=1024,
                status="pending",
                uploaded_by=user.id,
            )
            session.add_all([img1, img2])
            await session.commit()
            await session.refresh(img1)

            # Add starter prediction for img1
            pred = Prediction(
                image_id=img1.id,
                mask_storage_path="",
                confidence=0.884,
                uncertainty_score=0.116,
                findings_json=[
                    {"pathology": "Cardiomegaly", "confidence": 0.88, "location": "Cardiac silhouette"},
                    {"pathology": "Pleural Effusion", "confidence": 0.74, "location": "Bilateral costophrenic angles"},
                ],
                model_version="chexnet-seg-v1.4",
            )
            session.add(pred)
            await session.commit()
            logger.info("✅ Seeded initial clinical cohorts and sample chest radiographs.")
    except Exception as e:
        logger.warning("Could not seed initial cohorts: %s", e)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("MEDORA API starting — environment: %s", settings.environment)
    db_ok = check_db_connection()
    if db_ok:
        logger.info("✅ Database connection: OK")
        await seed_demo_user()
        await seed_initial_cohorts()
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

# ── Static Storage Files ──────────────────────────────────────────────────────
STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "storage"))
os.makedirs(os.path.join(STORAGE_DIR, "raw-images"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "masks"), exist_ok=True)
app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")


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


