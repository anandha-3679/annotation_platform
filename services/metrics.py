"""
services/metrics.py — Computes Dice score between AI mask and human-corrected mask.

Dice = 2 * |A ∩ B| / (|A| + |B|)

Where:
  A = AI predicted mask (binary pixels from predictions table)
  B = Human corrected mask (binary pixels from annotations table)

A Dice of 1.0 = perfect agreement. 0.0 = no overlap.
This is stored in annotations.dice_score for the Progress Dashboard.
"""

import numpy as np
from PIL import Image
import io


def compute_dice(mask_a_bytes: bytes, mask_b_bytes: bytes, threshold: float = 0.5) -> float:
    """
    Computes Dice coefficient between two mask PNG images.

    Args:
        mask_a_bytes: AI mask PNG as bytes
        mask_b_bytes: Human-corrected mask PNG as bytes
        threshold: pixel value threshold to binarize (0–1)

    Returns:
        Dice score as a float 0–1. Returns 0.0 if both masks are empty.
    """
    def to_binary(mask_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(mask_bytes)).convert("L")  # grayscale
        arr = np.array(img, dtype=np.float32) / 255.0
        return (arr > threshold).astype(np.uint8)

    mask_a = to_binary(mask_a_bytes)
    mask_b = to_binary(mask_b_bytes)

    intersection = np.sum(mask_a * mask_b)
    total = np.sum(mask_a) + np.sum(mask_b)

    if total == 0:
        return 0.0  # both masks empty — undefined, return 0

    return round(float(2.0 * intersection / total), 4)
