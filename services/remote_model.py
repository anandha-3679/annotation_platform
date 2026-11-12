"""services/remote_model.py — Client + adapter for the deployed U-Net Deep Learning (DL) service (Render).

The DL service exposes:
  GET  /health       -> warm-up / liveness
  GET  /model-info   -> model_name, architecture, input_size, class_names, thresholds, device
  POST /predict      -> multipart `file`, header `X-API-Key`; returns per-class masks,
                        probability maps, confidence, uncertainty and image_uncertainty.

The API key is only ever used server-side.
"""

from __future__ import annotations

import base64
import io
import logging
import re
from typing import Any, Optional

import httpx
from PIL import Image

from core.config import settings
from services.model_service import PredictionOutput

logger = logging.getLogger(__name__)

# Known class colours / anatomical location labels; unknown classes get a palette colour.
CLASS_STYLE: dict[str, tuple[str, str]] = {
    "Aortic enlargement": ("#F59E0B", "Aortic knob / mediastinum"),
    "Cardiomegaly": ("#EF4444", "Cardiac silhouette"),
    "Pleural thickening": ("#3B82F6", "Pleural margins"),
    "Pulmonary fibrosis": ("#10B981", "Lung parenchyma"),
    "Lung Opacity": ("#EC4899", "Lung fields"),
}
FALLBACK_PALETTE = ["#8B5CF6", "#06B6D4", "#84CC16", "#F97316", "#E11D48", "#14B8A6"]
MASK_ALPHA = 150


class RemoteModelError(Exception):
    """Raised when the remote DL service fails. `status_code` is the HTTP code to return."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def class_style(name: str, index: int) -> tuple[str, str]:
    if name in CLASS_STYLE:
        return CLASS_STYLE[name]
    return FALLBACK_PALETTE[index % len(FALLBACK_PALETTE)], "Chest"


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def colorize_mask(b64_png: str, hex_color: str, size: tuple[int, int]) -> Image.Image:
    """Decodes a grayscale binary mask, resizes (nearest) and colourises it as RGBA."""
    raw = base64.b64decode(b64_png.split(",", 1)[-1])
    gray = Image.open(io.BytesIO(raw)).convert("L").resize(size, Image.NEAREST)
    alpha = gray.point(lambda p: MASK_ALPHA if p >= 128 else 0)
    rgba = Image.new("RGBA", size, (*_hex_to_rgb(hex_color), 0))
    rgba.putalpha(alpha)
    return rgba


def _png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _severity(confidence: float, threshold: float) -> str:
    if confidence < threshold:
        return "Not detected"
    margin = confidence - threshold
    if margin >= 0.25:
        return "Severe"
    if margin >= 0.1:
        return "Moderate"
    return "Mild"


def adapt_unet_response(
    raw: dict[str, Any],
    out_width: Optional[int] = None,
    out_height: Optional[int] = None,
) -> PredictionOutput:
    """Converts the ML /predict JSON into Medora's PredictionOutput.

    - Composite mask = alpha-composite of all *detected* classes (confidence >= threshold).
    - Per-class colourised masks are returned in `class_masks` keyed by slug.
    """
    width = int(out_width or raw.get("original_width") or raw.get("input_width") or 256)
    height = int(out_height or raw.get("original_height") or raw.get("input_height") or 256)
    size = (width, height)

    composite = Image.new("RGBA", size, (0, 0, 0, 0))
    class_masks: dict[str, bytes] = {}
    findings: list[dict[str, Any]] = []
    detected_conf: list[float] = []
    all_conf: list[float] = []

    for idx, name in enumerate(raw.get("class_names", [])):
        color, location = class_style(name, idx)
        conf = float(raw.get("confidence", {}).get(name, 0.0))
        thr = float(raw.get("thresholds", {}).get(name, 0.5))
        unc = float(raw.get("uncertainty", {}).get(name, 0.0))
        detected = conf >= thr
        slug = slugify(name)
        all_conf.append(conf)

        mask_b64 = raw.get("masks", {}).get(name)
        if mask_b64:
            colored = colorize_mask(mask_b64, color, size)
            class_masks[slug] = _png_bytes(colored)
            if detected:
                composite = Image.alpha_composite(composite, colored)
        if detected:
            detected_conf.append(conf)

        findings.append(
            {
                "id": slug,
                "pathology": name,
                "location": location,
                "severity": _severity(conf, thr),
                "confidence": round(conf, 4),
                "description": f"{name}: confidence {conf:.2f} vs threshold {thr:.2f}"
                + (" (detected)" if detected else " (below threshold)"),
                "detected": detected,
                "threshold": thr,
                "uncertainty": round(unc, 4),
                "color": color,
            }
        )

    confidence = max(detected_conf) if detected_conf else (max(all_conf) if all_conf else 0.0)
    uncertainty = float(raw.get("image_uncertainty", 0.0))

    return PredictionOutput(
        mask_png_bytes=_png_bytes(composite),
        confidence=round(min(max(confidence, 0.0), 1.0), 4),
        uncertainty_score=round(min(max(uncertainty, 0.0), 1.0), 4),
        findings=findings,
        model_version=str(raw.get("model_version", "unknown")),
        width=width,
        height=height,
        class_masks=class_masks,
    )


class RemoteModelClient:
    """Async HTTP client for the deployed DL service."""

    def __init__(self) -> None:
        self.model_info: Optional[dict[str, Any]] = None

    @property
    def base_url(self) -> str:
        return settings.effective_dl_url.rstrip("/")

    @property
    def enabled(self) -> bool:
        return bool(settings.use_remote_model and settings.effective_dl_url)

    async def health(self, timeout: float = 5.0) -> bool:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(f"{self.base_url}/health")
                return r.status_code == 200
        except httpx.HTTPError:
            return False

    async def fetch_model_info(self) -> Optional[dict[str, Any]]:
        try:
            timeout = settings.dl_api_timeout or settings.ml_api_timeout
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(f"{self.base_url}/model-info")
                r.raise_for_status()
                self.model_info = r.json()
        except httpx.HTTPError as exc:
            logger.warning("Could not fetch DL /model-info: %s", exc)
        return self.model_info

    async def predict(self, image_bytes: bytes, filename: str, content_type: str) -> dict[str, Any]:
        api_key = settings.effective_dl_api_key
        headers = {"X-API-Key": api_key} if api_key else {}
        files = {"file": (filename, image_bytes, content_type)}
        last_exc: Optional[Exception] = None

        # Wake the server up (Render free tier cold start); non-fatal.
        await self.health(timeout=10.0)

        timeout = settings.dl_api_timeout or settings.ml_api_timeout
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    r = await client.post(f"{self.base_url}/predict", headers=headers, files=files)
            except httpx.TimeoutException as exc:
                last_exc = exc
                logger.warning("DL /predict timed out (attempt %d)", attempt + 1)
                continue
            except httpx.HTTPError as exc:
                raise RemoteModelError(f"AI service unreachable: {exc}") from exc

            if r.status_code in (401, 403):
                logger.error("DL service rejected API key (HTTP %s). Check DL_API_KEY/ML_API_KEY.", r.status_code)
                raise RemoteModelError("AI service auth failed", 502)
            if r.status_code == 422:
                raise RemoteModelError(f"AI service rejected the image: {r.text[:300]}", 400)
            if r.status_code in (502, 503, 504):
                last_exc = RemoteModelError(f"AI service unavailable (HTTP {r.status_code})")
                continue
            if r.status_code >= 400:
                raise RemoteModelError(f"AI service error (HTTP {r.status_code}): {r.text[:300]}")
            return r.json()

        raise RemoteModelError(f"AI service did not respond: {last_exc}", 504)


remote_model_client = RemoteModelClient()

