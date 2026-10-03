"""
api/projects.py — CRUD endpoints for Cohorts / Projects.
"""

from typing import List, Optional
from datetime import datetime
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from models.tables import Project, Image, User
from core.database import get_async_session
from core.auth import current_active_user, optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "active"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    owner_id: uuid.UUID
    total_images: int = 0
    annotated_images: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[ProjectResponse], include_in_schema=False)
@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """
    List all cohorts/projects with counts of total images and completed annotations.
    """
    stmt = (
        select(
            Project,
            func.count(Image.id).label("total_images"),
            func.count(case((Image.status == "done", 1))).label("annotated_images"),
        )
        .outerjoin(Image, Image.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    result = await session.execute(stmt)
    rows = result.all()

    projects = []
    for proj, total, annotated in rows:
        projects.append(
            ProjectResponse(
                id=proj.id,
                name=proj.name,
                description=proj.description,
                status=proj.status,
                owner_id=proj.owner_id,
                total_images=total or 0,
                annotated_images=annotated or 0,
                created_at=proj.created_at,
                updated_at=proj.updated_at,
            )
        )
    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """
    Create a new project/cohort assigned to the authenticated radiologist.
    """
    if payload.status not in ("active", "completed", "archived"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: 'active', 'completed', 'archived'",
        )

    project = Project(
        name=payload.name.strip(),
        description=(payload.description or "").strip(),
        status=payload.status,
        owner_id=current_user.id,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)

    logger.info("Created project '%s' (id=%s) by user %s", project.name, project.id, current_user.id)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        owner_id=project.owner_id,
        total_images=0,
        annotated_images=0,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    current_user: Optional[User] = Depends(optional_current_user),
):
    """
    Get detailed information for a specific project.
    """
    stmt = (
        select(
            Project,
            func.count(Image.id).label("total_images"),
            func.count(case((Image.status == "done", 1))).label("annotated_images"),
        )
        .outerjoin(Image, Image.project_id == Project.id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    )
    result = await session.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    proj, total, annotated = row
    return ProjectResponse(
        id=proj.id,
        name=proj.name,
        description=proj.description,
        status=proj.status,
        owner_id=proj.owner_id,
        total_images=total or 0,
        annotated_images=annotated or 0,
        created_at=proj.created_at,
        updated_at=proj.updated_at,
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """
    Update project details (name, description, status).
    """
    stmt = select(Project).where(Project.id == project_id)
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name.strip()
    if payload.description is not None:
        project.description = payload.description.strip()
    if payload.status is not None:
        if payload.status not in ("active", "completed", "archived"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be one of: 'active', 'completed', 'archived'",
            )
        project.status = payload.status

    await session.commit()
    await session.refresh(project)

    # Re-fetch image counts
    count_stmt = (
        select(
            func.count(Image.id).label("total_images"),
            func.count(case((Image.status == "done", 1))).label("annotated_images"),
        )
        .where(Image.project_id == project.id)
    )
    count_res = await session.execute(count_stmt)
    total, annotated = count_res.first() or (0, 0)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        owner_id=project.owner_id,
        total_images=total or 0,
        annotated_images=annotated or 0,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """
    Delete a project and cascade delete associated images and annotations.
    """
    stmt = select(Project).where(Project.id == project_id)
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await session.delete(project)
    await session.commit()
    logger.info("Deleted project %s by user %s", project_id, current_user.id)
    return None
