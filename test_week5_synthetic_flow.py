"""test_week5_synthetic_flow.py — One-shot in-process ASGI test for Week 5 AI Prediction flow.

Verifies:
1. Health check.
2. Authenticate as radiologist.
3. Create test cohort.
4. Upload test radiograph.
5. Invoke POST /predict (AI inference with synthetic generator).
6. Verify mask saved on disk and row recorded in `predictions` table.
7. Verify idempotency: calling POST /predict again returns existing prediction.
8. Accept prediction: POST /annotations with source='ai_accepted' and prediction_id.
9. Verify image status updated to 'done' and annotation verified.
"""

import asyncio
import io
import os
import httpx
from PIL import Image, ImageDraw
from main import app, lifespan

async def run_week5_test():
    print("Testing Week 5 Synthetic AI Inference & Persistence (in-process ASGI)...")

    async with lifespan(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
            
            # 1. Health
            health_resp = await client.get("/health")
            assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
            print("1. Health check: OK")

            # 2. Login
            login_resp = await client.post(
                "/auth/jwt/login",
                data={"username": "radiologist@medora.health", "password": "demo-password-123"},
            )
            assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("2. Radiologist login: OK")

            # 3. Create Project
            proj_resp = await client.post(
                "/projects",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "name": "Week 5 Synthetic AI Verification Cohort",
                    "description": "Verifying model_service and POST /predict persistence",
                    "status": "active",
                },
            )
            assert proj_resp.status_code in (200, 201), f"Create project failed: {proj_resp.text}"
            project_id = proj_resp.json()["id"]
            print(f"3. Created Cohort: {project_id}")

            # 4. Upload radiograph
            img = Image.new("RGB", (512, 512), color=(15, 15, 25))
            draw = ImageDraw.Draw(img)
            draw.ellipse((80, 80, 432, 432), fill=(160, 160, 175))
            buf = io.BytesIO()
            img.save(buf, format="PNG")

            upload_resp = await client.post(
                "/images/upload",
                headers=headers,
                data={"project_id": project_id},
                files={"file": ("test_week5_cxr.png", buf.getvalue(), "image/png")},
            )
            assert upload_resp.status_code == 201, f"Upload failed: {upload_resp.text}"
            image_record = upload_resp.json()
            image_id = image_record["id"]
            print(f"4. Uploaded radiograph: {image_id} (Status: {image_record['status']})")

            # 5. Call POST /predict
            predict_resp = await client.post(
                "/predict",
                headers={**headers, "Content-Type": "application/json"},
                json={"image_id": image_id},
            )
            assert predict_resp.status_code == 200, f"Predict failed: {predict_resp.text}"
            pred_data = predict_resp.json()
            assert "mask_url" in pred_data
            assert "confidence" in pred_data
            assert "findings" in pred_data
            assert len(pred_data["findings"]) > 0
            prediction_id = pred_data["id"]
            print(f"5. AI Prediction Generated: ID={prediction_id}, Confidence={pred_data['confidence']}, Findings={len(pred_data['findings'])}")

            # 6. Check physical mask file exists
            mask_rel_path = pred_data["mask_storage_path"]
            storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "storage"))
            abs_mask = os.path.join(storage_dir, mask_rel_path)
            assert os.path.exists(abs_mask), f"Mask file not found on disk: {abs_mask}"
            print(f"6. Verified mask file on disk: {mask_rel_path}")

            # 7. Test Idempotency (calling predict again returns existing prediction)
            pred_again_resp = await client.post(
                "/predict",
                headers={**headers, "Content-Type": "application/json"},
                json={"image_id": image_id},
            )
            assert pred_again_resp.status_code == 200
            pred_again_data = pred_again_resp.json()
            assert pred_again_data["id"] == prediction_id, "Should reuse existing prediction"
            print("7. Predict idempotency verified: Reused existing prediction")

            # 8. Accept prediction via POST /annotations (source='ai_accepted')
            accept_resp = await client.post(
                "/annotations",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "image_id": image_id,
                    "prediction_id": prediction_id,
                    "mask_storage_path": pred_data["mask_storage_path"],
                    "findings_json": pred_data["findings"],
                    "source": "ai_accepted",
                    "dice_score": 0.94,
                },
            )
            assert accept_resp.status_code == 201, f"Accept annotation failed: {accept_resp.text}"
            ann_data = accept_resp.json()
            assert ann_data["source"] == "ai_accepted"
            print(f"8. AI Prediction Accepted: Annotation ID={ann_data['id']}, Source={ann_data['source']}")

            # 9. Verify image status is 'done'
            img_detail_resp = await client.get(f"/images/detail/{image_id}", headers=headers)
            assert img_detail_resp.status_code == 200
            assert img_detail_resp.json()["status"] == "done", "Image status should be 'done' after acceptance"
            print("9. Image status updated to: 'done'")

    print("\nAll Week 5 backend synthetic inference and acceptance tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_week5_test())
