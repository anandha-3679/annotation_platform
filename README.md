# ChestAnnotate 🫁 (working name)

[#chestannotate-](#chestannotate-)

A full-stack **AI-assisted annotation platform for chest X-rays** — upload a dataset, get an
AI-predicted segmentation mask, correct it in a Canva-style canvas editor, and let **Smart Review**
surface the images the model is least confident about first (active learning loop).

> **Read this like a plan.** The first three sections (Stack → Architecture → File map) tell you
> *what we're building* in 60 seconds. Everything after is reference detail (data model, API,
> build order, gotchas) you jump to when you're actually coding that part.

**Team:** 3 people — Person 1 (TBD — data/research/eval?), **Person 2 (you) — web app + integration**,
Person 3 — DL model (PyTorch, chest X-ray segmentation).

---

## 1. Stack (what we're wiring up)

[#1-stack](#1-stack)

| Layer             | Choice                                                             | Notes                                        |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------- |
| **Frontend**       | React + Vite, Tailwind CSS, shadcn/ui, React Router                | SPA, not Next.js — no SSR needed for this     |
| **Canvas/editor**  | React-Konva                                                        | image + mask overlay, brush/eraser/zoom       |
| **Backend**        | FastAPI                                                             | talks to Person 3's PyTorch model             |
| **AI**             | PyTorch model (Person 3) — served via FastAPI endpoint              | returns mask + confidence/uncertainty score   |
| **Database**       | Supabase Postgres                                                   | projects, images, annotations, versions       |
| **Auth**           | Supabase Auth                                                       | Admin vs Clinician/Annotator roles            |
| **File storage**   | Supabase Storage                                                    | X-ray images + saved masks                    |
| **Charts**         | Recharts                                                            | Progress Dashboard                            |
| **Forms/validation** | React Hook Form + Zod                                              |                                                |
| **Notifications**  | Sonner                                                               |                                                |
| **Icons**          | Lucide React                                                         |                                                |
| **Animation**      | Framer Motion                                                        | low priority, polish pass only                |
| **Deploy**         | Frontend → Vercel · Backend → Render/Railway                        |                                                |

**Explicitly excluded (don't add):** Redis, WebSockets, microservices, Docker/Kubernetes, separate
Node backend, LLM/chatbot, MCP, complex custom auth. Keep infra minimal — the annotation canvas and
AI loop are where the effort should go.

---

## 2. Architecture at a glance

[#2-architecture](#2-architecture)

```
Browser (React + Vite)
  │  fetch/axios + Supabase JWT (lib/api.ts wrapper)
  ▼
FastAPI (main.py)
  ├─ /auth (delegated to Supabase Auth on the client mostly)
  ├─ /projects           → CRUD projects
  ├─ /images              → upload/list images, status
  ├─ /predict             → runs Person 3's model → mask + confidence
  ├─ /annotations          → save human-corrected mask, version history
  ├─ /review-queue         → images sorted by uncertainty (Smart Review)
  └─ /progress             → aggregate stats (Dice, accept/correct ratio, cycle)
        │
        ├──────────────► Supabase Postgres (projects, images, annotations, versions, users)
        ├──────────────► Supabase Storage (raw images, saved masks)
        └──────────────► PyTorch model (Person 3), loaded in-process or as a model service
```

**Design principle to keep:** metrics (Dice score, % accepted, counts) are computed from **stored
annotation data via SQL/aggregation**, not guessed client-side. The AI mask and the human-corrected
mask are stored **separately** so you can always recompute accuracy/Dice between them.

---

## 3. Repository layout

[#3-repo-layout](#3-repo-layout)

Single repo is simplest for a 3-person, 2-month project — no need for Chia's multi-branch split
unless deploy constraints force it.

```
chest-annotate/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── app/             # route pages (Home, Projects, SmartReview, Progress, Guidelines)
│   │   ├── components/
│   │   │   ├── ui/            # shadcn primitives
│   │   │   ├── layout/        # Sidebar, Topbar
│   │   │   ├── home/          # SearchBar, ContinueWorking, LearnCards
│   │   │   ├── workspace/     # AnnotationCanvas (Konva), Toolbar, AIPanel
│   │   │   └── dashboard/     # progress charts
│   │   ├── hooks/            # useProjects, useImages, useAnnotations, useReviewQueue
│   │   ├── lib/               # api.ts (fetch wrapper), supabaseClient.ts
│   │   ├── store/             # Zustand (or Context) — canvas state, auth state
│   │   └── types/             # TS types mirroring backend schemas
│   └── package.json
├── backend/                # FastAPI app
│   ├── main.py               # app entry, CORS, routers
│   ├── core/
│   │   ├── config.py           # settings/env
│   │   └── database.py         # Supabase/Postgres connection
│   ├── api/
│   │   ├── projects.py
│   │   ├── images.py
│   │   ├── predict.py           # calls the model
│   │   ├── annotations.py
│   │   ├── review.py
│   │   └── progress.py
│   ├── services/
│   │   ├── model_service.py     # wraps Person 3's PyTorch model
│   │   ├── uncertainty.py       # computes/reads uncertainty score for review queue
│   │   └── metrics.py           # Dice score, accept/correct ratio
│   ├── models/                 # ORM tables
│   ├── schemas/                # Pydantic request/response models
│   └── requirements.txt
└── README.md                # this file
```

---

## 4. File map — key modules (fill in as you build)

[#4-file-map](#4-file-map)

### Frontend

[#frontend-files](#frontend-files)

| File/Folder                             | What it is                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `lib/api.ts`                             | Single fetch wrapper — injects Supabase JWT, JSON helper, error handling.   |
| `lib/supabaseClient.ts`                  | Supabase client init (Auth + Storage + DB access from client where needed). |
| `store/auth.ts`                          | Current user, role (Admin/Annotator).                                       |
| `store/canvas.ts`                        | Active tool, zoom, brush size, mask layer state for the Konva canvas.       |
| `components/layout/Sidebar.tsx`          | Home / Projects / Smart Review / Progress / Guidelines / Settings nav.      |
| `components/home/ContinueWorking.tsx`    | Recently edited project cards.                                             |
| `components/workspace/AnnotationCanvas.tsx` | React-Konva canvas: image layer + AI mask layer + user-edit layer.       |
| `components/workspace/Toolbar.tsx`       | Brush, eraser, undo/redo, zoom controls.                                   |
| `components/workspace/AIPanel.tsx`       | Confidence/uncertainty display, Accept/Edit buttons.                       |
| `components/dashboard/*`                 | Recharts widgets — reviewed count, accept ratio, Dice trend, cycle number. |
| `hooks/use-review-queue.ts`              | Fetches Smart Review queue sorted by uncertainty, "Review Next" logic.     |

### Backend

[#backend-files](#backend-files)

| File                          | What it is                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `main.py`                     | App entry, mounts routers, CORS, `/health`.                                    |
| `core/config.py`               | Env/settings wrapper.                                                          |
| `core/database.py`             | DB engine/session (Supabase Postgres via pooler — see §11 gotchas).           |
| `api/predict.py`               | `POST /predict` — image in, mask + confidence out. Calls `model_service`.      |
| `api/annotations.py`           | `POST/GET /annotations` — save corrected mask, fetch version history.          |
| `api/review.py`                | `GET /review-queue` — images sorted by uncertainty score.                      |
| `api/progress.py`              | `GET /progress` — aggregate stats per project.                                  |
| `services/model_service.py`    | Wraps Person 3's PyTorch model — load once, `predict(image) -> (mask, score)`. |
| `services/uncertainty.py`      | Turns model confidence output into a sortable uncertainty score.               |
| `services/metrics.py`          | Dice score calc between AI mask and human-corrected mask.                      |

---

## 5. Data model

[#5-data-model](#5-data-model)

| Table                | Key fields                                                                                     | Notes                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `users`               | id (UUID), email, role (admin/annotator), name                                                    | from Supabase Auth + profile fields                                |
| `projects`            | id, name, owner_id→users, created_at, status                                                       |                                                                      |
| `images`              | id, project_id→projects, storage_path, status (pending/in_review/done), uploaded_at                |                                                                      |
| `predictions`         | id, image_id→images, mask_storage_path, confidence, uncertainty_score, model_version, created_at   | the AI's raw output — never overwritten                            |
| `annotations`         | id, image_id→images, user_id→users, mask_storage_path, source (ai_accepted/human_edited), created_at | the "final" mask for that review pass                              |
| `annotation_versions` | id, annotation_id→annotations, mask_snapshot, created_at                                            | version history for undo / audit                                    |
| `review_cycles`       | id, project_id→projects, cycle_number, started_at                                                   | tracks active learning cycles                                       |

All FKs `ON DELETE CASCADE`. Predictions and annotations kept **separate** so Dice/accuracy between
AI and human can always be recomputed.

---

## 6. API surface (planned)

[#6-api-surface](#6-api-surface)

| Method | Path                       | Auth | Purpose                                                    |
| ------- | ---------------------------- | ---- | -------------------------------------------------------------- |
| POST    | `/projects`                  | ✓    | create project                                                |
| GET     | `/projects`                  | ✓    | list projects (search/filter by name, date, status)           |
| POST    | `/images`                    | ✓    | upload image(s) to a project                                  |
| GET     | `/images/:project_id`        | ✓    | list images in a project                                      |
| POST    | `/predict`                   | ✓    | run model on an image → mask + confidence                     |
| POST    | `/annotations`               | ✓    | save human-reviewed/corrected annotation                       |
| GET     | `/annotations/:image_id`     | ✓    | fetch current + version history for an image                  |
| GET     | `/review-queue/:project_id`  | ✓    | images sorted by uncertainty (Smart Review)                    |
| GET     | `/progress/:project_id`      | ✓    | reviewed count, accept/correct ratio, Dice, cycle number        |
| GET     | `/health`                    | —    | liveness check                                                 |

---

## 7. Build order (see roadmap discussion — logic before shell)

[#7-build-order](#7-build-order)

1. **React-Konva sandbox** (standalone) — load image, draw/erase mask, undo/redo, export mask. No app around it yet.
2. **Mock AI overlay** — fake `{mask, confidence}` response rendered on the canvas.
3. **App shell** — sidebar, routing, auth, Home page (search / Continue Working / Learn cards) wrapped around the proven canvas.
4. **Real data layer** — Supabase tables live, upload flow, Projects page real data.
5. **Real AI integration** — FastAPI `/predict` calling Person 3's actual model.
6. **Smart Review + Progress Dashboard** — uncertainty queue, Recharts stats.
7. **Polish** — Guidelines/Help pages, admin views, empty/loading states, animations.

---

## 8. Run locally (fill in once scaffolded)

[#8-run-locally](#8-run-locally)

### Backend (`backend/`)

```
# from chest-annotate/backend/
pip install -r requirements.txt
uvicorn main:app --reload          # docs at http://127.0.0.1:8000/docs
```

Needs `backend/.env` (gitignored) with `DATABASE_URL` (Supabase pooler), `SUPABASE_URL`, `SUPABASE_KEY`.

### Frontend (`frontend/`)

```
# from chest-annotate/frontend/
npm install
npm run dev                        # http://localhost:5173
```

---

## 9. Deploy (plan)

[#9-deploy](#9-deploy)

### Backend → Render/Railway

- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Watch out for model file size — PyTorch checkpoints can be large; check platform's storage/build limits before relying on it.

### Frontend → Vercel

- Framework preset: Vite
- Env: `VITE_API_URL` (backend URL), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 10. Environment variables (planned)

[#10-env-vars](#10-env-vars)

### Backend

| Key            | Notes                                                                 |
| --------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`  | Supabase **Session pooler** URI — direct host is IPv6-only, often unreachable from PaaS hosts like Render. |
| `SUPABASE_URL`  | For storage access from backend if needed.                            |
| `SUPABASE_KEY`  | Service role key (backend only — never expose to frontend).           |
| `MODEL_PATH`    | Path/URL to Person 3's model checkpoint.                               |

### Frontend

| Key                       | Notes                          |
| --------------------------- | ------------------------------- |
| `VITE_API_URL`              | Backend base URL.               |
| `VITE_SUPABASE_URL`         | Supabase project URL.           |
| `VITE_SUPABASE_ANON_KEY`    | Public anon key (safe for client). |

---

## 11. Notes & gotchas (read before debugging)

[#11-gotchas](#11-gotchas)

- **Supabase + PaaS hosts:** always use the **Session pooler** connection string, not the direct
  `db.<ref>.supabase.co` host — the direct host is often IPv6-only and unreachable from Render/Railway.
- **AI mask vs human mask are separate tables** (`predictions` vs `annotations`). Never overwrite the
  AI's original prediction — you need it intact to compute Dice/accuracy against the human correction.
- **Uncertainty score contract:** agree with Person 3 early on exactly what the model returns (a single
  float? per-pixel confidence map? class probabilities?) — this decides how Smart Review sorts its queue.
  Mock this in Phase 2/3 so you're not blocked waiting on the real model.
- **Large images/masks:** chest X-rays can be large files — decide early whether Konva works with
  downsampled previews for editing vs full-res only for export, to keep the canvas responsive.
- **Version history storage:** naive full-snapshot versioning can bloat storage fast if annotators
  iterate a lot — fine for MVP/2-month scope, but note it as a known limitation, not a design flaw.
- **Roles:** Admin vs Annotator gating can start as simple conditional UI + a role check on backend
  routes — don't build a full permissions system for a 2-month project.
- **Secrets:** all `.env*` gitignored except any file explicitly meant to hold public values (e.g. anon key). Never commit DB passwords, service role keys, or model artifacts if large/private.

---

## About

Chest X-ray AI Annotation Platform — mini-project (3-person team). Person 2 (web app + integration) owns this README as the build reference.
