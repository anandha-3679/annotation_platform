"""services/model_service.py — Wraps Person 3's PyTorch model (stub, Week 5)."""

def predict(image_bytes: bytes) -> tuple[bytes, float]:
    """
    Runs the segmentation model on the input image.
    Returns: (mask_png_bytes, confidence_score 0–1)

    TODO Week 5: load model from MODEL_PATH, run inference, return real mask.
    """
    raise NotImplementedError("model_service.predict — coming in Week 5")
