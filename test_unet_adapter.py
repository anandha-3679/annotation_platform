"""test_unet_adapter.py — One-shot test for adapt_unet_response using a real ML /predict response."""

import io
import json
import os

from PIL import Image

from services.remote_model import adapt_unet_response

FIXTURE = os.path.join(os.path.dirname(__file__), "tests", "fixtures", "unet_predict_response.json")


def main():
    with open(FIXTURE, encoding="utf-8") as f:
        raw = json.load(f)

    out = adapt_unet_response(raw)

    assert len(out.findings) == 5, out.findings
    detected = {f["pathology"] for f in out.findings if f["detected"]}
    expected = {n for n in raw["class_names"] if raw["confidence"][n] >= raw["thresholds"][n]}
    assert detected == expected, detected
    assert out.uncertainty_score == round(raw["image_uncertainty"], 4)
    assert out.confidence == round(raw["confidence"]["Aortic enlargement"], 4)
    assert out.model_version == "unet-v1"
    assert (out.width, out.height) == (2304, 2880)
    assert len(out.class_masks) == 5

    comp = Image.open(io.BytesIO(out.mask_png_bytes))
    assert comp.size == (2304, 2880) and comp.mode == "RGBA"
    assert comp.getchannel("A").getbbox() is not None, "composite mask is empty"

    print("adapter OK:", {f["pathology"]: (f["confidence"], f["severity"]) for f in out.findings})


if __name__ == "__main__":
    main()
