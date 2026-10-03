"""api/images.py — Image upload/list (stub, implemented Week 4)."""
from fastapi import APIRouter

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/")
async def upload_image():
    return {"message": "upload_image — coming in Week 4"}

@router.get("/{project_id}")
async def list_images(project_id: str):
    return {"message": f"list_images for {project_id} — coming in Week 4"}
