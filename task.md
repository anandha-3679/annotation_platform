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
  - Styling: Dark-mode clinical interface (Vanilla CSS).
  - Router: `react-router-dom` v7 with routes for Dashboard, Annotation Workspace, Active Learning cohorts, Project Management, and Settings.
- **Rules & Linters**:
  - Python: `ruff` (errors-only mode via `backend/ruff.toml`), `pytest -q`.
  - JS: `oxlint` (`npm run lint -- --quiet`).

---

# Immediate Next Steps

<!-- Atomic, unchecked tasks ready for planning and execution -->
- [ ] 

---

# Completed Tasks

<!-- Move finished atomic items here -->