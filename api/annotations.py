"""
api/annotations.py — Save and retrieve radiologist segmentation masks & clinical findings.
"""

from typing import List, Optional, Any
from datetime import datetime
import uuid
import os
import base64
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.tables import Annotation, AnnotationVersion, Image, Prediction, User
from core.database import get_async_session
from core.auth import current_active_user, optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/annotations", tags=["annotations"])

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))


# ── Schemas ───────────────────────────────────────────────────────────────────
class AnnotationCreate(BaseModel):
    image_id: uuid.UUID
    mask_data_url: Optional[str] = None  # base64 data URL from Konva canvas export
    mask_storage_path: Optional[str] = None
    findings_json: Optional[List[Any]] = []
    source: Optional[str] = "human_edited"  # 'human_edited' | 'ai_accepted'
    dice_score: Optional[float] = None
    prediction_id: Optional[uuid.UUID] = None


class AnnotationResponse(BaseModel):
    id: uuid.UUID
    image_id: uuid.UUID
    user_id: uuid.UUID
    prediction_id: Optional[uuid.UUID] = None
    mask_storage_path: Optional[str] = None
    mask_url: Optional[str] = None
    source: str = "human_edited"
    findings_json: List[Any] = []
    dice_score: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def build_mask_url(storage_path: Optional[str]) -> Optional[str]:
    if not storage_path:
        return None
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        return storage_path
    normalized = storage_path.replace("\\", "/").lstrip("/")
    return f"/storage/{normalized}"


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def save_annotation(
    payload: AnnotationCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """
    Save or update human radiologist annotation for an image.
    Accepts base64 canvas export, saves mask PNG to disk, updates image status to 'done'.
    """
    # 1. Verify image exists
    img_stmt = select(Image).where(Image.id == payload.image_id)
    img_res = await session.execute(img_stmt)
    image = img_res.scalar_one_or_none()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image {payload.image_id} not found",
        )

    # 2. Process mask file if base64 data URL provided
    mask_path = payload.mask_storage_path
    if payload.mask_data_url:
        try:
            data = payload.mask_data_url
            if "," in data:
                data = data.split(",", 1)[1]
            mask_bytes = base64.b64decode(data)

            timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{payload.image_id}_{timestamp_str}.png"
            relative_mask_path = f"masks/{filename}"
            abs_mask_path = os.path.join(STORAGE_DIR, "masks", filename)
            os.makedirs(os.path.dirname(abs_mask_path), exist_ok=True)

            with open(abs_mask_path, "wb") as f:
                f.write(mask_bytes)

            mask_path = relative_mask_path
        except Exception as e:
            logger.error("Failed to decode and save mask image: %s", e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid mask image data: {str(e)}",
            )

    # 3. Check for existing annotation for this image
    ann_stmt = select(Annotation).where(Annotation.image_id == payload.image_id)
    ann_res = await session.execute(ann_stmt)
    annotation = ann_res.scalar_one_or_none()

    if annotation:
        # Update existing annotation
        annotation.user_id = current_user.id
        if mask_path:
            annotation.mask_storage_path = mask_path
        annotation.source = payload.source or "human_edited"
        annotation.findings_json = payload.findings_json or []
        if payload.dice_score is not None:
            annotation.dice_score = payload.dice_score
        if payload.prediction_id:
            annotation.prediction_id = payload.prediction_id
        annotation.updated_at = datetime.utcnow()
    else:
        # Create new annotation
        annotation = Annotation(
            id=uuid.uuid4(),
            image_id=payload.image_id,
            user_id=current_user.id,
            prediction_id=payload.prediction_id,
            mask_storage_path=mask_path,
            source=payload.source or "human_edited",
            findings_json=payload.findings_json or [],
            dice_score=payload.dice_score,
        )
        session.add(annotation)

    await session.flush()

    # 4. Save version history snapshot
    if mask_path:
        version = AnnotationVersion(
            annotation_id=annotation.id,
            mask_snapshot=mask_path,
            findings_json=payload.findings_json or [],
        )
        session.add(version)

    # 5. Update image status to 'done'
    image.status = "done"

    await session.commit()
    await session.refresh(annotation)

    logger.info(
        "Saved annotation %s for image %s by user %s (source: %s)",
        annotation.id,
        payload.image_id,
        current_user.id,
        annotation.source,
    )

    return AnnotationResponse(
        id=annotation.id,
        image_id=annotation.image_id,
        user_id=annotation.user_id,
        prediction_id=annotation.prediction_id,
        mask_storage_path=annotation.mask_storage_path,
        mask_url=build_mask_url(annotation.mask_storage_path),
        source=annotation.source,
        findings_json=annotation.findings_json or [],
        dice_score=annotation.dice_score,
        created_at=annotation.created_at,
        updated_at=annotation.updated_at,
    )


@router.get("/{image_id}", response_model=Optional[AnnotationResponse])
async def get_annotation_for_image(
    image_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """
    Fetch the latest saved annotation for an image.
    If no human annotation exists, checks for active AI prediction to pre-populate canvas.
    """
    stmt = (
        select(Annotation)
        .where(Annotation.image_id == image_id)
        .order_by(Annotation.updated_at.desc())
    )
    result = await session.execute(stmt)
    ann = result.scalar_one_or_none()

    if ann:
        return AnnotationResponse(
            id=ann.id,
            image_id=ann.image_id,
            user_id=ann.user_id,
            prediction_id=ann.prediction_id,
            mask_storage_path=ann.mask_storage_path,
            mask_url=build_mask_url(ann.mask_storage_path),
            source=ann.source,
            findings_json=ann.findings_json or [],
            dice_score=ann.dice_score,
            created_at=ann.created_at,
            updated_at=ann.updated_at,
        )

    # If no annotation yet, check if there's an AI prediction
    pred_stmt = select(Prediction).where(Prediction.image_id == image_id).order_by(Prediction.created_at.desc())
    pred_res = await session.execute(pred_stmt)
    pred = pred_res.scalars().first()

    if pred:
        # Return prediction formatted as baseline suggestion
        return AnnotationResponse(
            id=pred.id,
            image_id=pred.image_id,
            user_id=pred.image_id,  # placeholder
            prediction_id=pred.id,
            mask_storage_path=pred.mask_storage_path,
            mask_url=build_mask_url(pred.mask_storage_path),
            source="ai_suggested",
            findings_json=pred.findings_json or [],
            dice_score=pred.confidence,
            created_at=pred.created_at,
            updated_at=pred.created_at,
        )

    return None
