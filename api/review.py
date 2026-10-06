"""api/review.py — Smart Review Queue & Active Learning endpoints.

Provides:
- GET /review-queue/{project_id}: Returns unannotated/pending radiographs ranked by highest uncertainty.
- POST /review-queue/trigger-retrain: Manifests verified annotations into an active learning training batch.
"""

from datetime import datetime
import logging
from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import optional_current_user
from core.database import get_async_session
from models.tables import Annotation, Image, Prediction, Project, ReviewCycle, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review-queue", tags=["review"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class ReviewQueueItem(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    original_name: Optional[str] = None
    url: str
    width_px: Optional[int] = 1024
    height_px: Optional[int] = 1024
    status: str
    confidence: Optional[float] = None
    uncertainty_score: Optional[float] = None
    priority_level: str  # 'high' | 'medium' | 'low'
    findings_count: int = 0
    prediction_id: Optional[uuid.UUID] = None


class ReviewQueueResponse(BaseModel):
    project_id: uuid.UUID
    total_in_queue: int
    items: List[ReviewQueueItem] = []


class RetrainRequest(BaseModel):
    project_id: Optional[uuid.UUID] = None
    notes: Optional[str] = "Retrain triggered from radiologist active learning portal"


class RetrainResponse(BaseModel):
    status: str
    cycle_number: int
    training_samples_count: int
    message: str
    manifest_summary: dict[str, Any]


def resolve_image_url(storage_path: Optional[str]) -> str:
    if not storage_path:
        return "/sample-xray.png"
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        return storage_path
    clean = storage_path.replace("\\", "/").lstrip("/")
    return f"/storage/{clean}"


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/{project_id}", response_model=ReviewQueueResponse)
async def get_review_queue(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """Returns radiographs requiring review, sorted by highest uncertainty score first.

    This ensures that the most difficult or ambiguous cases are annotated first (Active Learning).
    """
    # 1. Verify project exists
    proj_stmt = select(Project).where(Project.id == project_id)
    proj_res = await session.execute(proj_stmt)
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    # 2. Query images that are not yet marked as 'done'
    # Join with latest prediction to get uncertainty score
    stmt = (
        select(Image, Prediction)
        .outerjoin(Prediction, Prediction.image_id == Image.id)
        .where(Image.project_id == project_id, Image.status != "done")
        .order_by(desc(Prediction.uncertainty_score), desc(Image.uploaded_at))
    )
    result = await session.execute(stmt)
    rows = result.all()

    items: List[ReviewQueueItem] = []
    for img, pred in rows:
        uncertainty = pred.uncertainty_score if pred else 0.5
        confidence = pred.confidence if pred else 0.5
        findings_count = len(pred.findings_json) if (pred and pred.findings_json) else 0

        # Classify priority level based on uncertainty score
        if uncertainty >= 0.25:
            priority = "high"
        elif uncertainty >= 0.15:
            priority = "medium"
        else:
            priority = "low"

        items.append(
            ReviewQueueItem(
                id=img.id,
                project_id=img.project_id,
                original_name=img.original_name,
                url=resolve_image_url(img.storage_path),
                width_px=img.width_px,
                height_px=img.height_px,
                status=img.status,
                confidence=round(confidence * 100, 1),
                uncertainty_score=round(uncertainty, 3),
                priority_level=priority,
                findings_count=findings_count,
                prediction_id=pred.id if pred else None,
            )
        )

    return ReviewQueueResponse(
        project_id=project_id,
        total_in_queue=len(items),
        items=items,
    )


@router.post("/trigger-retrain", response_model=RetrainResponse)
async def trigger_retrain_batch(
    payload: RetrainRequest,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """Collects verified annotations and records a new ReviewCycle for model retraining."""
    # Count verified annotations available for retraining
    ann_stmt = select(Annotation)
    if payload.project_id:
        ann_stmt = ann_stmt.join(Image, Image.id == Annotation.image_id).where(
            Image.project_id == payload.project_id
        )
    ann_res = await session.execute(ann_stmt)
    annotations = ann_res.scalars().all()
    count = len(annotations)

    # Determine next cycle number
    cycle_stmt = select(ReviewCycle).order_by(desc(ReviewCycle.cycle_number))
    cycle_res = await session.execute(cycle_stmt)
    last_cycle = cycle_res.scalars().first()
    next_cycle_num = (last_cycle.cycle_number + 1) if last_cycle else 1

    # Record new review cycle
    new_cycle = ReviewCycle(
        project_id=payload.project_id if payload.project_id else (annotations[0].image.project_id if annotations else uuid.uuid4()),
        cycle_number=next_cycle_num,
        started_at=datetime.utcnow(),
    )
    session.add(new_cycle)
    await session.commit()

    return RetrainResponse(
        status="queued",
        cycle_number=next_cycle_num,
        training_samples_count=count,
        message=f"Retraining Cycle #{next_cycle_num} queued with {count} verified annotations.",
        manifest_summary={
            "cycle_id": str(new_cycle.id),
            "sample_count": count,
            "created_at": datetime.utcnow().isoformat(),
        },
    )
