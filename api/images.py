"""
api/images.py — Chest X-ray image upload, retrieval, and management.
"""

from typing import List, Optional
from datetime import datetime
import uuid
import os
import io
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from PIL import Image as PILImage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.tables import Image, Project, Prediction, Annotation, User
from core.database import get_async_session
from core.auth import current_active_user, optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["images"])

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))


# ── Schemas ───────────────────────────────────────────────────────────────────
class ImageResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    storage_path: str
    url: str
    original_name: Optional[str] = None
    width_px: Optional[int] = None
    height_px: Optional[int] = None
    status: str = "pending"
    uploaded_at: Optional[datetime] = None
    confidence: Optional[float] = None
    has_annotation: bool = False

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────
def build_image_url(storage_path: str) -> str:
    """Returns accessible URL for the storage path."""
    if storage_path.startswith("http://") or storage_path.startswith("https://"):
        return storage_path
    normalized = storage_path.replace("\\", "/").lstrip("/")
    return f"/storage/{normalized}"


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/detail/{image_id}", response_model=ImageResponse)
async def get_image_detail(
    image_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """
    Get detailed information for a single image.
    """
    stmt = select(Image).where(Image.id == image_id)
    res = await session.execute(stmt)
    img = res.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    pred_stmt = select(Prediction).where(Prediction.image_id == img.id).order_by(Prediction.created_at.desc())
    pred_res = await session.execute(pred_stmt)
    pred = pred_res.scalars().first()

    ann_stmt = select(Annotation).where(Annotation.image_id == img.id)
    ann_res = await session.execute(ann_stmt)
    has_ann = ann_res.scalars().first() is not None

    return ImageResponse(
        id=img.id,
        project_id=img.project_id,
        storage_path=img.storage_path,
        url=build_image_url(img.storage_path),
        original_name=img.original_name,
        width_px=img.width_px,
        height_px=img.height_px,
        status=img.status,
        uploaded_at=img.uploaded_at,
        confidence=round(pred.confidence * 100, 1) if pred else None,
        has_annotation=has_ann,
    )


@router.get("/{project_id}", response_model=List[ImageResponse])
async def list_images_for_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """
    List all chest X-ray images for a specific project/cohort.
    """
    stmt = (
        select(Image)
        .where(Image.project_id == project_id)
        .order_by(Image.uploaded_at.desc())
    )
    result = await session.execute(stmt)
    images = result.scalars().all()

    response = []
    for img in images:
        # Check if prediction exists
        pred_stmt = (
            select(Prediction)
            .where(Prediction.image_id == img.id)
            .order_by(Prediction.created_at.desc())
        )
        pred_res = await session.execute(pred_stmt)
        pred = pred_res.scalars().first()

        # Check if annotation exists
        ann_stmt = select(Annotation).where(Annotation.image_id == img.id)
        ann_res = await session.execute(ann_stmt)
        has_ann = ann_res.scalars().first() is not None

        response.append(
            ImageResponse(
                id=img.id,
                project_id=img.project_id,
                storage_path=img.storage_path,
                url=build_image_url(img.storage_path),
                original_name=img.original_name,
                width_px=img.width_px,
                height_px=img.height_px,
                status=img.status,
                uploaded_at=img.uploaded_at,
                confidence=round(pred.confidence * 100, 1) if pred else None,
                has_annotation=has_ann,
            )
        )
    return response


@router.post("/upload", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    project_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """
    Upload a raw chest X-ray radiograph (PNG/JPG/DICOM).
    Stores file in storage/raw-images/{project_id}/ and inserts DB record.
    """
    # Verify project exists
    proj_stmt = select(Project).where(Project.id == project_id)
    proj_res = await session.execute(proj_stmt)
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    # Read file content
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    # Read image dimensions
    width, height = None, None
    try:
        with PILImage.open(io.BytesIO(contents)) as pil_img:
            width, height = pil_img.size
    except Exception as e:
        logger.warning("Could not parse image dimensions: %s", e)

    # Generate destination path
    ext = os.path.splitext(file.filename or "")[1].lower() or ".png"
    safe_name = f"{uuid.uuid4().hex[:12]}_{os.path.basename(file.filename or 'xray.png')}"
    relative_path = f"raw-images/{project_id}/{safe_name}"
    target_abs = os.path.join(STORAGE_DIR, "raw-images", str(project_id), safe_name)
    os.makedirs(os.path.dirname(target_abs), exist_ok=True)

    # Write file to storage
    with open(target_abs, "wb") as f:
        f.write(contents)

    # Insert DB record
    image_record = Image(
        project_id=project_id,
        storage_path=relative_path,
        original_name=file.filename or safe_name,
        width_px=width,
        height_px=height,
        status="pending",
        uploaded_by=current_user.id,
    )
    session.add(image_record)
    await session.commit()
    await session.refresh(image_record)

    logger.info("Uploaded image %s (%dx%d) for project %s", image_record.id, width or 0, height or 0, project_id)

    return ImageResponse(
        id=image_record.id,
        project_id=image_record.project_id,
        storage_path=image_record.storage_path,
        url=build_image_url(image_record.storage_path),
        original_name=image_record.original_name,
        width_px=image_record.width_px,
        height_px=image_record.height_px,
        status=image_record.status,
        uploaded_at=image_record.uploaded_at,
        confidence=None,
        has_annotation=False,
    )
