"""api/annotations.py — Save/fetch annotations (stub, implemented Week 4)."""
from fastapi import APIRouter

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.post("/")
async def save_annotation():
    return {"message": "save_annotation — coming in Week 4"}

@router.get("/{image_id}")
async def get_annotation(image_id: str):
    return {"message": f"get_annotation for {image_id} — coming in Week 4"}
