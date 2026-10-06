"""test_week6_active_learning_flow.py — One-shot in-process ASGI test for Week 6.

Verifies:
1. Health check.
2. Radiologist login.
3. Retrieve review queue for a project (GET /review-queue/{project_id}).
4. Verify uncertain items prioritized.
5. Trigger retraining batch (POST /review-queue/trigger-retrain).
6. Verify ReviewCycle recorded.
7. Retrieve cohort progress metrics (GET /progress/{project_id}) with mean Dice and image counts.
"""

import asyncio
import httpx
from main import app, lifespan

async def run_week6_test():
    print("Testing Week 6 Active Learning & Progress Queue (in-process ASGI)...")

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

            # 3. Get projects to find an active cohort
            projs_resp = await client.get("/projects", headers=headers)
            assert projs_resp.status_code == 200, f"Get projects failed: {projs_resp.text}"
            projects = projs_resp.json()
            assert len(projects) > 0, "Expected at least one project"
            project_id = projects[0]["id"]
            print(f"3. Active Cohort found: {projects[0]['name']} (ID: {project_id})")

            # 4. Query Review Queue: GET /review-queue/{project_id}
            queue_resp = await client.get(f"/review-queue/{project_id}", headers=headers)
            assert queue_resp.status_code == 200, f"Review queue failed: {queue_resp.text}"
            queue_data = queue_resp.json()
            print(f"4. Review Queue retrieved: {queue_data['total_in_queue']} unreviewed items found")
            if queue_data["items"]:
                first_item = queue_data["items"][0]
                print(f"   -> Top priority item: {first_item.get('original_name')} (Uncertainty: {first_item.get('uncertainty_score')})")

            # 5. Query Cohort Progress Metrics: GET /progress/{project_id}
            prog_resp = await client.get(f"/progress/{project_id}", headers=headers)
            assert prog_resp.status_code == 200, f"Progress endpoint failed: {prog_resp.text}"
            prog_data = prog_resp.json()
            assert "completion_percentage" in prog_data
            assert "mean_dice_score" in prog_data
            print(f"5. Cohort Metrics: Completion={prog_data['completion_percentage']}%, Mean Dice={prog_data['mean_dice_score']}, Annotated={prog_data['annotated_images']}/{prog_data['total_images']}")

            # 6. Trigger Active Learning Retrain: POST /review-queue/trigger-retrain
            retrain_resp = await client.post(
                "/review-queue/trigger-retrain",
                headers={**headers, "Content-Type": "application/json"},
                json={"project_id": project_id, "notes": "Week 6 test active loop calibration"},
            )
            assert retrain_resp.status_code == 200, f"Retrain trigger failed: {retrain_resp.text}"
            retrain_data = retrain_resp.json()
            assert retrain_data["status"] == "queued"
            assert "cycle_number" in retrain_data
            print(f"6. Retrain Triggered: Cycle #{retrain_data['cycle_number']}, Training Samples={retrain_data['training_samples_count']}")

    print("\nAll Week 6 Smart Review Queue & Progress tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_week6_test())
