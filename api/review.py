"""api/review.py — Smart Review queue (stub, implemented Week 6)."""
from fastapi import APIRouter

router = APIRouter(prefix="/review-queue", tags=["review"])

@router.get("/{project_id}")
async def get_review_queue(project_id: str):
    return {"message": f"review_queue for {project_id} — coming in Week 6"}
