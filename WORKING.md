# MEDORA — Project State & Resume Guide

> **Last Updated**: October 3, 2026  
> **Status**: Week 3 Complete | Ready for Week 4 (Supabase Storage & Backend API Sync)  
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

---

## 5. Next Steps — How to Resume Immediately

When starting the next session, proceed with **Week 4 & Supabase Real Integration**:

### Priority 1: Supabase Storage Buckets & Policies
1. In Supabase Dashboard, create storage buckets:
   - `raw-images` (public or authenticated read for radiographs)
   - `masks` (for ground truth and radiologist exported masks)
2. Execute `database/storage_policies.sql` in Supabase SQL Editor.

### Priority 2: Backend API Integration
3. Populate `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `backend/.env`.
4. Connect frontend API calls from `medora/src/pages/` to FastAPI backend endpoints:
   - `GET /api/projects` and `GET /api/images`
   - `POST /api/predict` (connect real model or mock AI service)
   - `POST /api/annotations` (persist doctor masks and clinical findings)
   - `POST /api/review` (record accept/reject decisions and uncertainty deltas)

### Priority 3: PyTorch Model Coordination
5. Synchronize with ML collaborator on checkpoint inputs/outputs (`chest_xray_seg.pth` inference and retraining batch format).

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
