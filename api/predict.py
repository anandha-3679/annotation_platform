"""api/predict.py — AI inference and prediction persistence endpoint.

Receives radiograph image_id, invokes the model service, saves the generated prediction
and segmentation mask to PostgreSQL / local storage, and returns structured findings.
"""

from datetime import datetime
import logging
import mimetypes
import os
from typing import List, Optional
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import optional_current_user
from core.config import settings
from core.database import get_async_session
from models.tables import Image, Prediction, User
from services.model_service import model_service
from services.remote_model import RemoteModelError, adapt_unet_response, remote_model_client

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
    # Per-class fields populated by the remote U-Net model
    detected: Optional[bool] = None
    threshold: Optional[float] = None
    uncertainty: Optional[float] = None
    color: Optional[str] = None
    mask_path: Optional[str] = None
    mask_url: Optional[str] = None


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


async def load_image_bytes(storage_path: Optional[str]) -> Optional[bytes]:
    """Reads raw image bytes from local storage or a remote (e.g. Supabase) URL."""
    if not storage_path:
        return None
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.get(storage_path)
                r.raise_for_status()
                return r.content
        except httpx.HTTPError as exc:
            logger.error("Failed to download image %s: %s", storage_path, exc)
            return None
    abs_path = os.path.join(STORAGE_DIR, storage_path.replace("\\", "/").lstrip("/"))
    if not os.path.exists(abs_path):
        return None
    with open(abs_path, "rb") as f:
        return f.read()


@router.get("/model-info", tags=["predict"])
async def model_info():
    """Returns cached metadata (class names, thresholds) of the remote ML model."""
    info = remote_model_client.model_info or await remote_model_client.fetch_model_info()
    if not info:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model info unavailable")
    return info


@router.post("/warmup", tags=["predict"])
async def warmup():
    """Pings the remote ML service so a cold Render instance starts booting."""
    return {"ml_service_up": await remote_model_client.health(timeout=10.0)}


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

    # 3. Read image dimensions
    width = image.width_px or 1024
    height = image.height_px or 1024

    # Deterministic seed based on image UUID int for reproducible predictions per study
    seed = int(image.id.int % 10000000)

    # 4. Run model inference: remote U-Net service, or synthetic fallback
    prediction_result = None
    if remote_model_client.enabled:
        image_bytes = await load_image_bytes(image.storage_path)
        if image_bytes is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image file not found in storage",
            )
        filename = image.original_name or os.path.basename(image.storage_path) or "image.png"
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        try:
            raw = await remote_model_client.predict(image_bytes, filename, content_type)
            prediction_result = adapt_unet_response(raw, image.width_px, image.height_px)
        except RemoteModelError as exc:
            logger.error("Remote inference failed for image %s: %s", image.id, exc)
            # Never substitute synthetic output for a real model failure.
            raise HTTPException(status_code=exc.status_code, detail=str(exc))

    if prediction_result is None:
        prediction_result = model_service.predict(
            image_bytes=None,
            width=width,
            height=height,
            seed=seed,
        )

    # 5. Persist mask PNG(s) to storage/masks/
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    mask_filename = f"pred_{image.id}_{timestamp_str}.png"
    relative_mask_path = f"masks/{mask_filename}"
    abs_mask_path = os.path.join(STORAGE_DIR, "masks", mask_filename)
    os.makedirs(os.path.dirname(abs_mask_path), exist_ok=True)

    with open(abs_mask_path, "wb") as f:
        f.write(prediction_result.mask_png_bytes)

    # Per-class masks (remote model only); paths recorded inside findings_json
    for finding in prediction_result.findings:
        class_png = prediction_result.class_masks.get(finding.get("id", ""))
        if not class_png:
            continue
        rel = f"masks/pred_{image.id}_{timestamp_str}_{finding['id']}.png"
        with open(os.path.join(STORAGE_DIR, rel), "wb") as f:
            f.write(class_png)
        finding["mask_path"] = rel
        finding["mask_url"] = build_mask_url(rel)

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
