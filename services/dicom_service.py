"""services/dicom_service.py — DICOM parsing and web preview renderer for Medora.

Extracts patient/study metadata, pixel arrays, handles PhotometricInterpretation
(e.g., MONOCHROME1 vs MONOCHROME2), applies VOI windowing, and generates an authentic
8-bit grayscale PNG for frontend canvas rendering.
"""

from __future__ import annotations

import io
import logging
from typing import Optional, Tuple
import numpy as np
from PIL import Image
import pydicom
from pydicom.pixel_data_handlers.util import apply_voi_lut

logger = logging.getLogger(__name__)


def is_dicom_file(filename: str, file_bytes: bytes) -> bool:
    """Checks whether file has a DICOM extension or DICM magic bytes."""
    ext = filename.lower()
    if ext.endswith(".dcm") or ext.endswith(".dicom"):
        return True
    # Standard DICOM header has 'DICM' at byte offset 128
    if len(file_bytes) > 132 and file_bytes[128:132] == b"DICM":
        return True
    return False


def parse_dicom_metadata(ds: pydicom.Dataset) -> dict:
    """Extracts clinical and technical metadata from DICOM dataset."""
    return {
        "modality": getattr(ds, "Modality", "CR"),
        "body_part": getattr(ds, "BodyPartExamined", "CHEST"),
        "patient_sex": getattr(ds, "PatientSex", "O"),
        "patient_age": getattr(ds, "PatientAge", ""),
        "view_position": getattr(ds, "ViewPosition", "PA"),
        "photometric_interpretation": getattr(ds, "PhotometricInterpretation", "MONOCHROME2"),
        "rows": int(getattr(ds, "Rows", 0)),
        "columns": int(getattr(ds, "Columns", 0)),
    }


def dicom_to_png_preview(file_bytes: bytes) -> Tuple[bytes, int, int, dict]:
    """Parses DICOM bytes, normalizes pixels, and returns (png_bytes, width, height, metadata)."""
    with io.BytesIO(file_bytes) as bio:
        ds = pydicom.dcmread(bio, force=True)

    metadata = parse_dicom_metadata(ds)
    rows = metadata["rows"]
    cols = metadata["columns"]

    # 1. Extract pixel array
    try:
        arr = ds.pixel_array.astype(float)
    except Exception as e:
        logger.error("Failed to read DICOM pixel_array: %s", e)
        raise ValueError(f"Cannot read pixel array from DICOM: {e}")

    # 2. Rescale Slope & Intercept
    slope = getattr(ds, "RescaleSlope", 1.0)
    intercept = getattr(ds, "RescaleIntercept", 0.0)
    if slope != 1.0 or intercept != 0.0:
        arr = arr * float(slope) + float(intercept)

    # 3. Apply VOI LUT (Window Center & Width) if present
    try:
        arr = apply_voi_lut(arr, ds)
    except Exception:
        # Fallback to percentile clipping if VOI LUT fails
        p_low, p_high = np.percentile(arr, (1, 99))
        arr = np.clip(arr, p_low, p_high)

    # 4. Handle Photometric Interpretation (MONOCHROME1 is inverted: 0 is white)
    photo_interp = metadata.get("photometric_interpretation", "MONOCHROME2")
    if photo_interp == "MONOCHROME1":
        arr = np.amax(arr) - arr

    # 5. Normalize to 0..255 uint8
    min_val, max_val = np.amin(arr), np.amax(arr)
    if max_val > min_val:
        norm = (arr - min_val) / (max_val - min_val) * 255.0
    else:
        norm = np.zeros_like(arr)
    uint8_img = norm.astype(np.uint8)

    # 6. Save as PNG
    img = Image.fromarray(uint8_img, mode="L")
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    png_bytes = buf.getvalue()

    return png_bytes, cols, rows, metadata

