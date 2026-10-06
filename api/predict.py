"""api/predict.py — AI inference and prediction persistence endpoint.

Receives radiograph image_id, invokes the model service, saves the generated prediction
and segmentation mask to PostgreSQL / local storage, and returns structured findings.
"""

from datetime import datetime
import logging
import os
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import optional_current_user
from core.database import get_async_session
from models.tables import Image, Prediction, User
from services.model_service import model_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predict"])

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    image_id: uuid.UUID
    force_recompute: Optional[bool] = False


class FindingItem(BaseModel):
    id: Optional[str] = None
    pathology: str
    location: Optional[str] = None
    severity: Optional[str] = None
    confidence: float
    description: Optional[str] = None


class PredictResponse(BaseModel):
    id: uuid.UUID
    image_id: uuid.UUID
    mask_storage_path: str
    mask_url: str
    confidence: float
    uncertainty_score: float
    findings: List[FindingItem] = []
    model_version: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def build_mask_url(storage_path: Optional[str]) -> str:
    if not storage_path:
        return ""
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        return storage_path
    normalized = storage_path.replace("\\", "/").lstrip("/")
    return f"/storage/{normalized}"


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("", response_model=PredictResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
@router.post("/", response_model=PredictResponse, status_code=status.HTTP_200_OK)
async def predict_image(
    payload: PredictRequest,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """Generates AI segmentation mask, uncertainty estimation, and clinical findings.

    Persists prediction into the database if not already computed, or returns the existing prediction.
    """
    # 1. Verify image exists
    img_stmt = select(Image).where(Image.id == payload.image_id)
    img_res = await session.execute(img_stmt)
    image = img_res.scalar_one_or_none()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {payload.image_id} not found",
        )

    # 2. Check if an existing prediction exists (unless forced recompute)
    if not payload.force_recompute:
        pred_stmt = (
            select(Prediction)
            .where(Prediction.image_id == payload.image_id)
            .order_by(Prediction.created_at.desc())
        )
        pred_res = await session.execute(pred_stmt)
        existing_pred = pred_res.scalars().first()

        # If existing prediction has a valid mask file, return it
        if existing_pred and existing_pred.mask_storage_path:
            abs_mask = os.path.join(STORAGE_DIR, existing_pred.mask_storage_path)
            if os.path.exists(abs_mask):
                findings_data = existing_pred.findings_json or []
                return PredictResponse(
                    id=existing_pred.id,
                    image_id=existing_pred.image_id,
                    mask_storage_path=existing_pred.mask_storage_path,
                    mask_url=build_mask_url(existing_pred.mask_storage_path),
                    confidence=existing_pred.confidence,
                    uncertainty_score=existing_pred.uncertainty_score,
                    findings=findings_data,
                    model_version=existing_pred.model_version,
                    created_at=existing_pred.created_at,
                )

    # 3. Read image dimensions or bytes if present
    width = image.width_px or 1024
    height = image.height_px or 1024

    # Deterministic seed based on image UUID int for reproducible predictions per study
    seed = int(image.id.int % 10000000)

    # 4. Run model inference via ModelService
    prediction_result = model_service.predict(
        image_bytes=None,
        width=width,
        height=height,
        seed=seed,
    )

    # 5. Persist mask PNG to storage/masks/
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    mask_filename = f"pred_{image.id}_{timestamp_str}.png"
    relative_mask_path = f"masks/{mask_filename}"
    abs_mask_path = os.path.join(STORAGE_DIR, "masks", mask_filename)
    os.makedirs(os.path.dirname(abs_mask_path), exist_ok=True)

    with open(abs_mask_path, "wb") as f:
        f.write(prediction_result.mask_png_bytes)

    # 6. Save prediction row to PostgreSQL
    new_prediction = Prediction(
        image_id=image.id,
        mask_storage_path=relative_mask_path,
        confidence=prediction_result.confidence,
        uncertainty_score=prediction_result.uncertainty_score,
        findings_json=prediction_result.findings,
        model_version=prediction_result.model_version,
    )
    session.add(new_prediction)

    # Update image status to 'in_review' if it was 'pending'
    if image.status == "pending":
        image.status = "in_review"

    await session.commit()
    await session.refresh(new_prediction)

    return PredictResponse(
        id=new_prediction.id,
        image_id=new_prediction.image_id,
        mask_storage_path=new_prediction.mask_storage_path,
        mask_url=build_mask_url(new_prediction.mask_storage_path),
        confidence=new_prediction.confidence,
        uncertainty_score=new_prediction.uncertainty_score,
        findings=prediction_result.findings,
        model_version=new_prediction.model_version,
        created_at=new_prediction.created_at,
    )
