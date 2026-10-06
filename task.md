# Architecture Overview

## Domain
Clinical AI Chest Radiograph Annotation & Active Learning Platform (**Medora**).

## System Components
- **Backend (`/backend`)**:
  - FastAPI asynchronous REST API service.
  - PostgreSQL backing via Supabase (asyncpg / SQLAlchemy 2.0).
  - Storage bucket integrations for radiographs and segmentation masks.
  - Endpoints: Authentication (`fastapi-users`), Projects, Images, Annotations, AI Predictions, Review cycles, Metrics/Progress.
- **Frontend (`/medora`)**:
  - React 19 + Vite.
  - Interactive Canvas: `konva`, `react-konva`, `use-image` for bounding boxes, freehand drawing masks, brush/eraser, and undo/redo stacks.
  - Styling: Canva-inspired clinical interface (Vanilla CSS).
  - Router: `react-router-dom` v7 with routes for Dashboard, Annotation Workspace, Active Learning cohorts, Project Management, and Settings.
- **Rules & Linters**:
  - Python: `ruff` (errors-only mode via `backend/ruff.toml`), `pytest -q`.
  - JS: `oxlint` / `npm run build`.

# Immediate Next Steps

<!-- Week 8 Roadmap (When Model Weights Arrive) -->
### Week 8 (Real PyTorch Model Integration & Active Retraining):
- [ ] Copy `.pth`/`.pt` weights into `backend/models/` and configure PyTorch environment in `.venv`.
- [ ] Hot-swap `ModelService.predict()` in `backend/services/model_service.py` with real tensor preprocessing and forward inference pass.
- [ ] Map model tensor logits through sigmoid thresholding to generate production PNG mask overlays.
- [ ] Connect per-pixel entropy / Monte Carlo Dropout to generate real uncertainty scores in `predictions`.
- [ ] Benchmark CPU vs GPU inference latency on chest radiographs.
- [ ] Connect active learning retrain exports from `POST /review-queue/trigger-retrain` into Person 3's `train.py` fine-tuning pipeline.

---

# Completed Tasks

<!-- Move finished atomic items here -->
- [x] **Week 1**: Konva Canvas Sandbox with brush, eraser, pan/zoom, undo/redo, mask export.
- [x] **Week 2**: Mock AI overlay, 3-column layout concepts, Supabase PostgreSQL schema (7 tables) & Alembic setup.
- [x] **Week 3**: Canva UI Architecture & Full Frontend Implementation (React 19 + Vite, Vanilla CSS, Auth, Dashboard, Workspace, Active Learning UI).
- [x] **Week 4**: Real Data Layer & End-to-End Persistence (Projects CRUD, Image Uploads, Annotation persistence, ASGI test passed).
- [x] **Week 5**: Synthetic AI Generator (`model_service.py`), `POST /predict`, Konva Workspace live AI overlay & Accept/Edit persistence.
- [x] **Week 6**: Smart Active Learning Review Queue (`GET /review-queue/{project_id}`), Retrain Batch Worker (`POST /review-queue/trigger-retrain`), Cohort Clinical Progress Analytics (`GET /progress/{project_id}`), and UI Wiring in `ActiveLearning.jsx` & `Dashboard.jsx`.
- [x] **Week 7**: Clinical Guidelines (`/guidelines`), Admin Roster & Role Controls (`/settings`), Shimmer Skeleton Loaders & Toast Animations, Deployment Hardening (`render.yaml` & `vercel.json`).