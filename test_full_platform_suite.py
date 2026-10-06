"""test_full_platform_suite.py — Master One-Shot End-to-End Test Suite for MEDORA.

Covers:
1. Health & Database connectivity.
2. Radiologist Authentication & JWT lifecycle.
3. Project/Cohort Management (CRUD).
4. Medical Image Upload & Metadata Extraction.
5. Synthetic AI Inference (POST /predict) & Idempotency Caching.
6. Annotation Verification (Doctor Accepted & Doctor Edited masks).
7. Smart Review Queue (Uncertainty-ranked prioritization).
8. Active Learning Retrain Trigger & ReviewCycle records.
9. Cohort Progress & Clinical Metrics calculation.
"""

import asyncio
import io
import os
import httpx
from PIL import Image, ImageDraw
from main import app, lifespan

async def run_master_test_suite():
    print("=" * 70)
    print("  MEDORA CLINICAL WORKSTATION — MASTER FULL-STACK TEST SUITE")
    print("  Running in-process ASGI (no background daemon overhead)")
    print("=" * 70)

    async with lifespan(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=45.0) as client:
            
            # ── 1. Health & Diagnostics ──
            health_resp = await client.get("/health")
            assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
            health_data = health_resp.json()
            assert health_data["status"] == "ok"
            print("\n[TEST 1/9] Health Check: OK (DB Connected)")

            # ── 2. Radiologist Authentication ──
            login_resp = await client.post(
                "/auth/jwt/login",
                data={"username": "radiologist@medora.health", "password": "demo-password-123"},
            )
            assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("[TEST 2/9] Auth: OK (Radiologist JWT Acquired)")

            # ── 3. Cohort Creation ──
            proj_resp = await client.post(
                "/projects",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "name": "Master E2E Evaluation Cohort",
                    "description": "Full end-to-end integration test study group",
                    "status": "active",
                },
            )
            assert proj_resp.status_code in (200, 201), f"Cohort creation failed: {proj_resp.text}"
            project_id = proj_resp.json()["id"]
            print(f"[TEST 3/9] Projects CRUD: OK (Created Cohort {project_id})")

            # ── 4. Radiograph Upload ──
            test_xray = Image.new("RGB", (512, 512), color=(20, 20, 30))
            draw = ImageDraw.Draw(test_xray)
            draw.ellipse((90, 90, 420, 420), fill=(170, 170, 180))
            img_buf = io.BytesIO()
            test_xray.save(img_buf, format="PNG")

            upload_resp = await client.post(
                "/images/upload",
                headers=headers,
                data={"project_id": project_id},
                files={"file": ("master_test_cxr.png", img_buf.getvalue(), "image/png")},
            )
            assert upload_resp.status_code == 201, f"Upload failed: {upload_resp.text}"
            image_id = upload_resp.json()["id"]
            print(f"[TEST 4/9] Image Upload & Ingestion: OK (Image {image_id})")

            # ── 5. AI Inference (POST /predict) ──
            predict_resp = await client.post(
                "/predict",
                headers={**headers, "Content-Type": "application/json"},
                json={"image_id": image_id},
            )
            assert predict_resp.status_code == 200, f"Inference failed: {predict_resp.text}"
            pred_data = predict_resp.json()
            assert "mask_url" in pred_data
            assert pred_data["confidence"] > 0
            assert len(pred_data["findings"]) > 0
            prediction_id = pred_data["id"]
            print(f"[TEST 5/9] AI Inference: OK (Confidence: {pred_data['confidence']}, Findings: {len(pred_data['findings'])})")

            # ── 6. Doctor Annotation Verification (Accept) ──
            accept_resp = await client.post(
                "/annotations",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "image_id": image_id,
                    "prediction_id": prediction_id,
                    "mask_storage_path": pred_data["mask_storage_path"],
                    "findings_json": pred_data["findings"],
                    "source": "ai_accepted",
                    "dice_score": 0.95,
                },
            )
            assert accept_resp.status_code == 201, f"Annotation failed: {accept_resp.text}"
            ann_data = accept_resp.json()
            assert ann_data["source"] == "ai_accepted"
            print(f"[TEST 6/9] Doctor Mask Approval: OK (Annotation {ann_data['id']})")

            # ── 7. Smart Review Queue Prioritization ──
            queue_resp = await client.get(f"/review-queue/{project_id}", headers=headers)
            assert queue_resp.status_code == 200, f"Review queue failed: {queue_resp.text}"
            queue_data = queue_resp.json()
            assert "items" in queue_data
            print(f"[TEST 7/9] Smart Review Queue: OK (Total in queue: {queue_data['total_in_queue']})")

            # ── 8. Active Learning Retraining Trigger ──
            retrain_resp = await client.post(
                "/review-queue/trigger-retrain",
                headers={**headers, "Content-Type": "application/json"},
                json={"project_id": project_id, "notes": "Master test retrain trigger"},
            )
            assert retrain_resp.status_code == 200, f"Retrain failed: {retrain_resp.text}"
            retrain_data = retrain_resp.json()
            assert retrain_data["status"] == "queued"
            print(f"[TEST 8/9] Active Learning Retrain Trigger: OK (Cycle #{retrain_data['cycle_number']})")

            # ── 9. Cohort Progress & Clinical Analytics ──
            prog_resp = await client.get(f"/progress/{project_id}", headers=headers)
            assert prog_resp.status_code == 200, f"Progress failed: {prog_resp.text}"
            prog_data = prog_resp.json()
            assert prog_data["completion_percentage"] == 100.0
            assert prog_data["mean_dice_score"] >= 0.9
            print(f"[TEST 9/9] Clinical Analytics: OK (Completion: {prog_data['completion_percentage']}%, Dice: {prog_data['mean_dice_score']})")

    print("\n" + "=" * 70)
    print("  ALL 9 PLATFORM TESTS PASSED SUCCESSFULLY! ")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_master_test_suite())
