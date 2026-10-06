# MEDORA — Project State & Resume Guide

> **Last Updated**: October 6, 2026  
> **Status**: Week 7 Complete (Guidelines, Admin Roles, UX Shimmer Polish & Deployment Hardened) — Ready for Week 8 PyTorch Model Drop-In  
> **Active Directory**: `c:\Users\Anandha Lakshmi\mini_project`

---

## 1. Project Overview & Vision

**MEDORA** is an AI-assisted chest X-ray annotation platform tailored for radiologists. It incorporates an **active learning loop**:
- Radiologists review AI-predicted segmentation masks.
- Alongside the image, findings and confidence scores are displayed.
- The radiologist can accept the prediction or edit/correct the mask on an interactive canvas and update the findings.
- Corrected masks and annotations are saved to train/fine-tune the ML model (handled by the ML engineer collaborator).

### Brand & Design System
- **App Name**: MEDORA (formerly ChestAnnotate)
- **Logo**: Violet gradient heartbeat ECG wave + radiation emblem (`medora/public/logo.jpg`)
- **UI Inspiration**: **Canva**
  - Modern, elegant 3-column layout (collapsible icon sidebar + navigation/project panel + main content area).
  - Color Palette: Deep royal violet (`#1E1B4B`), primary vibrant purple (`#7C3AED`), soft lavender accents, and sleek dark/light surfaces.
  - Typography: Clean modern sans-serif (Inter font family).
  - UI Elements: Circular quick-action cards, subtle gradients, pill tabs, floating toolbars, micro-animations.
  - **Styling Rule**: **Vanilla CSS only** using CSS variables in `index.css` (Strictly **NO TailwindCSS** unless explicitly requested).

---

## 2. Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend App** | React 19 + Vite (`medora/`) | React Router v7, Lucide Icons, `@supabase/supabase-js` |
| **Canvas Engine** | Konva / React-Konva | Prototype completed in `konva-sandbox/`, ready to transplant into `medora/` |
| **Backend API** | FastAPI (`backend/`) | Python 3.14+, SQLAlchemy ORM, psycopg3, Pydantic v2 |
| **Database** | PostgreSQL on Supabase | 7 relational tables, RLS policies, Alembic migrations |
| **Storage & Auth** | Supabase | Storage buckets (`raw-images`, `masks`), Supabase Auth |

---

## 3. Progress Log (What's Done)

### ✅ Week 1: Core Annotation Canvas Prototype
- **Location**: `konva-sandbox/src/`
- Implemented `AnnotationCanvas.jsx` using Konva (smooth brush strokes, eraser, pan & zoom, undo/redo history, canvas export).
- Created `SandboxToolbar.jsx` and isolated `constants.js` to ensure clean Vite Hot Module Replacement (HMR).

### ✅ Week 2 (Days 8–9): AI Prediction & Findings Panel
- **Location**: `konva-sandbox/src/`
- Implemented `mockAI.js` to simulate asynchronous inference with bounding boxes/masks.
- Implemented `AIPanel.jsx` with confidence meters, editable clinical findings, and toggleable Accept / Edit workflows.
- Built 3-layer Konva rendering: Base X-ray Image Layer → AI Mask Overlay Layer → Radiologist Correction Layer.
- Validated via 7 comprehensive browser tests (all passed).

### ✅ Week 2 (Days 10–13): Database Schema & FastAPI Backend
- **Database & Migrations**:
  - `database/schema.sql` (7 core tables: `users`, `projects`, `images`, `model_versions`, `predictions`, `annotations`, `audit_logs`).
  - `backend/models/tables.py` (SQLAlchemy 2.0 ORM declarations for all 7 tables in `public` schema).
  - Configured Alembic (`backend/alembic/`) with autogenerate filters for the `public` schema.
  - **Ran `alembic upgrade head`** — all 7 tables are live and verified in the Supabase PostgreSQL database.
- **Backend API**:
  - `backend/main.py`: FastAPI application with async lifespan handler, CORS middleware, and `/health` route.
  - `backend/core/database.py`: Live psycopg3 session pooler connection with TCP keepalive configurations.
  - `/health` endpoint verified: returns `{"status": "ok", "db": "connected"}`.
  - Scaffolded API endpoints: `projects`, `images`, `predict`, `annotations`, `review`, `progress`.

### ✅ Week 3: Canva UI Architecture & Full Frontend Implementation (Complete)
- **Design System**: Complete Canva-inspired Vanilla CSS design tokens in `medora/src/index.css` (Inter font, violet palette `#1E1B4B` & `#7C3AED`, floating pills, glassmorphism, micro-animations).
- **Authentication**: Powered by **FastAPI Users** prebuilt routers (`POST /auth/jwt/login`, `POST /auth/jwt/logout`, `POST /auth/register`, `GET /users/me`). Full JWT Bearer transport with SQLAlchemy asyncpg ORM session, seeded default radiologist account (`radiologist@medora.health`), and 1-click radiologist demo login. Split-screen Canva auth pages in `Login.jsx` and `Signup.jsx`.
- **Canva 3-Column Shell**:
  - `Sidebar.jsx`: 64px compact icon rail in Canva dark purple.
  - `ProjectPanel.jsx`: 240px collapsible folder / cohort manager with quick filters.
  - `TopBar.jsx`: Breadcrumbs, search input, notification bell, and New Study trigger.
  - `AppShell.jsx`: Responsive layout container.
- **Canva Dashboard (`Dashboard.jsx`)**:
  - Hero greeting: `Welcome to MEDORA, Dr. Anandha Lakshmi ✦` with violet gradient.
  - Circular quick-action category icons (Annotate Studio, Upload Study, AI Queue, Active ML Loop, Audit Logs).
  - Active learning cycle progress card and cohort cards grid.
- **Studies & Cohort Gallery (`ProjectPage.jsx`)**:
  - Filterable radiograph cards with AI confidence gauges and quick-edit launch triggers.
- **Canva-Inspired Annotation Studio (`AnnotationWorkspace.jsx`)**:
  - Top editor bar with case title, status pills, undo/redo, export PNG mask.
  - Left tool rail (Tools, AI Model, Layers, Adjust) with expandable 280px drawer.
  - Multi-layer Konva canvas with brush, eraser, pan/zoom, and floating bottom pill controls.
  - Right inspector with AI confidence meter, editable clinical findings, and direct feed into Active ML retrain loop.
- **Active Learning Calibration Hub (`ActiveLearning.jsx`)**:
  - Mean Dice score progression (0.742 → 0.892 across iterations).
  - High uncertainty sampling queue table for priority radiologist review.
  - PyTorch training batch worker trigger.
- **Verification**: `vite build` passed in 3.17s (0 errors). Browser testing with subagent verified all flows, interactions, and captured screenshots.

### ✅ Week 4: Real Data Layer & End-to-End Persistence (Complete)
- **FastAPI Endpoints**:
  - `POST /projects` & `GET /projects`: Cohort CRUD with dynamic image & verified counts. Supports both slash and slashless paths without 307 redirects.
  - `POST /images/upload` & `GET /images/{project_id}`: Multipart image uploads with PIL metadata extraction and database registration.
  - `POST /annotations` & `GET /annotations/{image_id}`: Mask saving (with `annotation_id` flush & version snapshots) and reloading.
- **Frontend Wiring**:
  - `ProjectPanel.jsx` & `Dashboard.jsx`: Live cohort management, new cohort modal, and study upload modal.
  - `ProjectPage.jsx`: Filterable radiograph grid with live query param sync (`filter`, `search`).
  - `AnnotationWorkspace.jsx`: Loads real radiograph from database, restores saved masks and findings, updates case status to `DOCTOR VERIFIED`.
  - `AnnotationCanvas.jsx`: Unified mask layer (`maskLayerRef`) so the eraser cleanly erases AI masks and manual strokes alike; exports full-opacity mask composite.
- **Verification**: Verified via one-shot in-process ASGI test `backend/test_week4_flow.py` (all 9 steps passed: login → create cohort → upload image → list images → save mask → retrieve mask → verify image status → verify cohort counts). No background servers left running.

---

## 4. Key Gotchas & Technical Insights

1. **Python 3.14.2 Compatibility**:
   - `psycopg3` must be used instead of `psycopg2` (avoid C-build issues on Windows).
   - In `backend/core/database.py`, the `keepalives` parameter must be an integer (`1`), NOT a boolean.
   - Pinned dependencies use loose versioning (`>=`) to let pip resolve pre-built binary wheels.
2. **Supabase Database Credentials**:
   - The password contains special characters (`#`, `@`), which are stored URL-encoded in `backend/.env`.
   - Alembic's `ConfigParser` requires escaping `%` as `%%` when dynamically assigning `sqlalchemy.url`.
   - Uses Supabase Session Pooler (port 5432) to support IPv4 connections reliably.
3. **Vite Fast Refresh**:
   - Non-component definitions (like `TOOLS` objects or enums) must reside in separate files (`constants.js`), not in `.jsx` component files.
4. **Styling Constraint**:
   - Standard Vanilla CSS with CSS custom properties in `index.css`. No Tailwind.

### ✅ Week 5: Synthetic AI Model Service & Prediction Loop (Complete)
- **Model Service (`backend/services/model_service.py`)**:
  - Implemented high-fidelity synthetic chest radiograph segmentation generator: bilateral lung fields, cardiac silhouette, and consolidation/effusion pathology highlights with alpha transparency.
  - Outputs realistic confidence, uncertainty scores, and structured clinical findings.
  - Architecture prepared for zero-refactor hot-swapping once PyTorch `.pt`/`.pth` weights are supplied.
- **FastAPI AI Prediction (`POST /predict`)**:
  - Validates image, reuses/caches existing predictions (idempotent), stores physical mask PNGs to `backend/storage/masks/`, and writes rows to the PostgreSQL `predictions` table.
- **Frontend Workspace (`AnnotationWorkspace.jsx`)**:
  - Automatically queries `/predict` for unreviewed studies.
  - Renders AI mask overlay and findings in the inspector panel.
  - Full **Accept** (`source='ai_accepted'`) and **Edit** (`source='human_edited'`) mask workflows with canvas eraser/brush integration.
- **Verification**: Verified via `test_week5_synthetic_flow.py` (9/9 ASGI assertions passed).

### ✅ Week 6: Smart Active Learning Review Queue & Progress Analytics (Complete)
- **Review Queue (`GET /review-queue/{project_id}`)**:
  - Surfaces unannotated radiographs ordered by highest uncertainty (`predictions.uncertainty_score DESC`) to prioritize ambiguous cases.
- **Active Retrain Worker (`POST /review-queue/trigger-retrain`)**:
  - Packages doctor-verified segmentations into training manifests and registers new cycles in the `review_cycles` table.
- **Clinical Progress & Calibration Analytics (`GET /progress/{project_id}`)**:
  - Computes real-time cohort completion percentage, verified counts, and mean Dice similarity coefficients across doctor annotations in PostgreSQL.
- **Frontend Wiring**:
  - `ActiveLearning.jsx`: Cohort dropdown, live uncertainty sampling queue, retrain cycle triggers with success feedback, and iteration cards.
  - `Dashboard.jsx`: Live cohort metrics and active learning pulse cards reflecting live database status.
- **Verification**: Verified via `test_week6_active_learning_flow.py` (6/6 ASGI assertions passed) and `npm run build` (passed in 1.41s).

### ✅ Week 7: Clinical Guidelines, Admin Roles, UX Polish & Deployment Hardening (Complete)
- **Clinical Guidelines & Protocol Manual (`/guidelines` & `Guidelines.jsx`)**:
  - Full radiological documentation: window/level assessment standards, pathology reference guide (Consolidation `#7C3AED`, Pleural Effusion `#3B82F6`, Pneumothorax `#EF4444`), active learning uncertainty sampling workflows, canvas shortcut directory, and HIPAA de-identification protocol.
  - Linked to the sidebar Help action and routed within AppShell.
- **Admin Roster & Permission Controls (`/settings` & `Settings.jsx`)**:
  - Tabbed administration view: User profile preferences, radiologist roster & role assignment (`Admin Radiologist`, `Staff Radiologist`, `ML Engineer`), and live infrastructure connection diagnostics.
- **UX Resilience & Polish**:
  - Added shimmer skeleton loader states (`.skeleton`) and floating toast notifications (`.toast-pill`) with slide-up micro-animations.
  - Empty states across galleries and queues with upload buttons.
- **Deployment Hardening**:
  - Configured `backend/render.yaml` with production environment flags, database pooler mappings, and `/health` restart monitor.
  - Configured `medora/vercel.json` with SPA catch-all rewrites and immutable asset caching headers.
- **Verification**: `npm run build` compiled cleanly in 1.44s with 0 errors.

---

## 6. Development Commands Quick Reference

### Running the Backend
```powershell
cd "c:\Users\Anandha Lakshmi\mini_project\backend"
.venv\Scripts\uvicorn main:app --reload --port 8000
```
Health check: `http://localhost:8000/health`

### Running the Frontend (Medora)
```powershell
cd "c:\Users\Anandha Lakshmi\mini_project\medora"
npm run dev
```

### Running the Konva Sandbox Prototype
```powershell
cd "c:\Users\Anandha Lakshmi\mini_project\konva-sandbox"
npm run dev
```

### Applying Future Database Migrations
```powershell
cd "c:\Users\Anandha Lakshmi\mini_project\backend"
.venv\Scripts\alembic revision --autogenerate -m "description_of_change"
.venv\Scripts\alembic upgrade head
```
