"""api/predict.py — AI prediction endpoint (stub, implemented Week 5)."""
from fastapi import APIRouter

router = APIRouter(prefix="/predict", tags=["predict"])

@router.post("/")
async def predict():
    # TODO Week 5: load Person 3's model via model_service, return mask + confidence
    return {"message": "predict — coming in Week 5"}
