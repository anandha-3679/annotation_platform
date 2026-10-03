"""api/progress.py — Progress/stats dashboard (stub, implemented Week 6)."""
from fastapi import APIRouter

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/{project_id}")
async def get_progress(project_id: str):
    return {"message": f"progress for {project_id} — coming in Week 6"}
