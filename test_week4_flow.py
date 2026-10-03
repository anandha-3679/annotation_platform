import asyncio
import base64
import io
from PIL import Image, ImageDraw
import httpx
from main import app, lifespan

async def run_one_shot_test():
    print("Running one-shot Week 4 integration test (in-process ASGI, no background server)...")

    # Run lifespan context to ensure DB and demo user/cohorts are initialized
    async with lifespan(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
            
            # 1. Health
            health_resp = await client.get("/health")
            assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
            print("1. Health check:", health_resp.json())

            # 2. Login
            print("2. Logging in as radiologist...")
            login_resp = await client.post(
                "/auth/jwt/login",
                data={"username": "radiologist@medora.health", "password": "demo-password-123"},
            )
            assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("   -> Success, JWT Token acquired.")

            # 3. Create Project
            print("3. Creating project via POST /projects...")
            proj_resp = await client.post(
                "/projects",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "name": "Week 4 One-Shot Verification Cohort",
                    "description": "Tested via in-process ASGI without background servers",
                    "status": "active",
                },
            )
            assert proj_resp.status_code in (200, 201), f"Create project failed: {proj_resp.text}"
            project = proj_resp.json()
            project_id = project["id"]
            print(f"   -> Created Project: {project['name']} (ID: {project_id})")

            # 4. Upload radiograph
            print("4. Uploading test radiograph via POST /images/upload...")
            img = Image.new("RGB", (512, 512), color=(20, 20, 30))
            draw = ImageDraw.Draw(img)
            draw.ellipse((100, 100, 412, 412), fill=(180, 180, 190))
            buf = io.BytesIO()
            img.save(buf, format="PNG")

            upload_resp = await client.post(
                "/images/upload",
                headers=headers,
                data={"project_id": project_id},
                files={"file": ("test_cxr_week4.png", buf.getvalue(), "image/png")},
            )
            assert upload_resp.status_code in (200, 201), f"Upload failed: {upload_resp.text}"
            uploaded_image = upload_resp.json()
            image_id = uploaded_image["id"]
            print(f"   -> Uploaded image ID: {image_id}, {uploaded_image['width_px']}x{uploaded_image['height_px']}, url: {uploaded_image['url']}")

            # 5. List images in project
            print("5. Listing project images via GET /images/{project_id}...")
            list_resp = await client.get(f"/images/{project_id}", headers=headers)
            assert list_resp.status_code == 200
            images = list_resp.json()
            assert len(images) >= 1
            print(f"   -> Found {len(images)} images in project.")

            # 6. Save annotation mask
            print("6. Saving annotation mask via POST /annotations...")
            mask_img = Image.new("RGBA", (512, 512), color=(0, 0, 0, 0))
            mask_draw = ImageDraw.Draw(mask_img)
            mask_draw.ellipse((150, 150, 350, 350), fill=(239, 68, 68, 180))
            mask_buf = io.BytesIO()
            mask_img.save(mask_buf, format="PNG")
            mask_b64 = "data:image/png;base64," + base64.b64encode(mask_buf.getvalue()).decode()

            ann_payload = {
                "image_id": image_id,
                "mask_data_url": mask_b64,
                "findings_json": [
                    {"pathology": "Consolidation", "confidence": 0.92, "severity": "Moderate"}
                ],
                "source": "human_edited",
                "dice_score": 0.88,
            }
            ann_resp = await client.post(
                "/annotations",
                headers={**headers, "Content-Type": "application/json"},
                json=ann_payload,
            )
            assert ann_resp.status_code in (200, 201), f"Save annotation failed: {ann_resp.text}"
            saved_ann = ann_resp.json()
            print(f"   -> Annotation saved! Mask URL: {saved_ann.get('mask_url')}")

            # 7. Retrieve annotation
            print("7. Retrieving saved annotation via GET /annotations/{image_id}...")
            get_ann_resp = await client.get(f"/annotations/{image_id}", headers=headers)
            assert get_ann_resp.status_code == 200
            retrieved_ann = get_ann_resp.json()
            assert retrieved_ann is not None
            assert retrieved_ann["image_id"] == image_id
            print(f"   -> Successfully retrieved mask: {retrieved_ann.get('mask_url')}")
            print(f"   -> Findings: {retrieved_ann['findings_json']}")

            # 8. Check image status is done
            print("8. Checking image status...")
            detail_resp = await client.get(f"/images/detail/{image_id}", headers=headers)
            assert detail_resp.status_code == 200
            detail = detail_resp.json()
            assert detail["status"] == "done"
            assert detail["has_annotation"] is True
            print(f"   -> Image status: {detail['status']}, has_annotation: {detail['has_annotation']}")

            # 9. Verify project stats
            print("9. Verifying updated project counts...")
            projs_resp = await client.get("/projects", headers=headers)
            assert projs_resp.status_code == 200
            matched = [p for p in projs_resp.json() if p["id"] == project_id][0]
            print(f"   -> Cohort stats: Total = {matched['total_images']}, Verified = {matched['annotated_images']}")
            assert matched["total_images"] == 1
            assert matched["annotated_images"] == 1

            print("\n[SUCCESS] ALL WEEK 4 END-TO-END FLOWS FULLY VERIFIED AND PASSING!")

if __name__ == "__main__":
    asyncio.run(run_one_shot_test())
