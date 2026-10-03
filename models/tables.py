"""
models/tables.py — SQLAlchemy ORM models for all 7 ChestAnnotate tables.

These mirror the schema in database/schema.sql but are defined in Python
so Alembic can auto-generate migrations and Week 4 CRUD can use the ORM.

Note on auth.users FK:
  The `users` table references auth.users (Supabase's internal auth table).
  We define that FK as a string to avoid needing to import the auth schema.
"""

from typing import Optional
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Text, Integer,
    DateTime, ForeignKey, CheckConstraint, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
import uuid


class Base(DeclarativeBase):
    pass


# ── 1. Users (FastAPI Users integrated) ───────────────────────────────────────
class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'annotator')", name="users_role_check"),
        {"schema": "public"},
    )

    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, default="annotator")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner", cascade="all, delete")
    annotations = relationship("Annotation", back_populates="user", cascade="all, delete")


# ── 2. Projects ───────────────────────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'completed', 'archived')",
            name="projects_status_check"
        ),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="projects")
    images = relationship("Image", back_populates="project", cascade="all, delete")
    review_cycles = relationship("ReviewCycle", back_populates="project", cascade="all, delete")


# ── 3. Images ─────────────────────────────────────────────────────────────────
class Image(Base):
    __tablename__ = "images"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'in_review', 'done')", name="images_status_check"),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("public.projects.id", ondelete="CASCADE"), nullable=False)
    storage_path = Column(String, nullable=False)
    original_name = Column(String)
    width_px = Column(Integer)
    height_px = Column(Integer)
    status = Column(String, nullable=False, default="pending")
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="images")
    predictions = relationship("Prediction", back_populates="image", cascade="all, delete")
    annotations = relationship("Annotation", back_populates="image", cascade="all, delete")


# ── 4. Predictions (AI output — never overwritten) ────────────────────────────
class Prediction(Base):
    __tablename__ = "predictions"
    __table_args__ = (
        CheckConstraint("confidence BETWEEN 0 AND 1", name="predictions_confidence_check"),
        CheckConstraint("uncertainty_score BETWEEN 0 AND 1", name="predictions_uncertainty_check"),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id = Column(UUID(as_uuid=True), ForeignKey("public.images.id", ondelete="CASCADE"), nullable=False)
    mask_storage_path = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    uncertainty_score = Column(Float, nullable=False)
    findings_json = Column(JSONB, default=list)
    model_version = Column(String, nullable=False, default="unknown")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    image = relationship("Image", back_populates="predictions")
    annotations = relationship("Annotation", back_populates="prediction")


# ── 5. Annotations (human-reviewed final mask) ────────────────────────────────
class Annotation(Base):
    __tablename__ = "annotations"
    __table_args__ = (
        CheckConstraint("source IN ('ai_accepted', 'human_edited')", name="annotations_source_check"),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id = Column(UUID(as_uuid=True), ForeignKey("public.images.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("public.predictions.id", ondelete="SET NULL"), nullable=True)
    mask_storage_path = Column(String, nullable=True)
    source = Column(String, nullable=False, default="human_edited")
    findings_json = Column(JSONB, default=list)
    dice_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    image = relationship("Image", back_populates="annotations")
    user = relationship("User", back_populates="annotations")
    prediction = relationship("Prediction", back_populates="annotations")
    versions = relationship("AnnotationVersion", back_populates="annotation", cascade="all, delete")


# ── 6. Annotation versions ────────────────────────────────────────────────────
class AnnotationVersion(Base):
    __tablename__ = "annotation_versions"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    annotation_id = Column(UUID(as_uuid=True), ForeignKey("public.annotations.id", ondelete="CASCADE"), nullable=False)
    mask_snapshot = Column(Text, nullable=False)
    findings_json = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    annotation = relationship("Annotation", back_populates="versions")


# ── 7. Review cycles ──────────────────────────────────────────────────────────
class ReviewCycle(Base):
    __tablename__ = "review_cycles"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("public.projects.id", ondelete="CASCADE"), nullable=False)
    cycle_number = Column(Integer, nullable=False, default=1)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="review_cycles")
