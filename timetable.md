# Build Timetable — Chest X-ray Annotation Platform

7 weeks × 6 days = 42 working days. Day 7 of each week is left open (buffer/rest/catch-up) — don't schedule new work there, use it only if you fall behind.

Logic-before-shell order: Konva sandbox → mock AI → app shell → real data → real AI → Smart Review/Progress → polish → integration.

---

## Week 1 — Konva Sandbox (de-risking the hardest part)

| Day | Task |
|---|---|
| 1 | Scaffold Vite project, install `konva` + `react-konva` + `use-image`. Get a placeholder X-ray image rendering on a Konva Stage. |
| 2 | Add a drawing layer: mouse-down/move/up freehand line drawing, rendered as semi-transparent overlay (mask look). |
| 3 | Add eraser mode (`destination-out` composite) and a brush-size control. |
| 4 | Add undo/redo using a simple state history stack. Add zoom/pan on the Stage. |
| 5 | Add mask export (`toDataURL` on the mask layer only) — download or console-log the PNG to confirm it works. |
| 6 | Clean up the sandbox into a single reusable `AnnotationCanvas` component (props: image URL, initial mask, onSave callback). This is the component you'll drop into the real app later. |
| 7 | Buffer / rest |

**End of week 1 checkpoint:** you can load any image, draw + erase a mask, undo/redo, zoom, and export the mask — as an isolated, reusable component.

---

## Week 2 — Mock AI Overlay + Project Setup

| Day | Task |
|---|---|
| 8 | Fake an AI response shape `{ maskUrl, confidence }` (hardcoded JSON) and render it as a third Konva layer on top of the image, below the user's edit layer. |
| 9 | Build the AI Panel UI (confidence %, Accept / Edit buttons) next to the canvas — wire Accept to lock the AI mask as final, Edit to let the user draw on top of it. |
| 10 | Create Supabase project: enable Auth, create Postgres tables from your data model (`users`, `projects`, `images`, `predictions`, `annotations`, `annotation_versions`, `review_cycles`). |
| 11 | Set up Supabase Storage buckets (raw images, masks). Test uploading/downloading a file manually via Supabase dashboard to confirm buckets work. |
| 12 | Init FastAPI project locally. Build `/health` endpoint. Connect to Supabase Postgres via the Session pooler — confirm connection works. |
| 13 | Deploy skeletons: blank Vite app → Vercel, blank FastAPI → Render/Railway. Confirm the deployed frontend can hit the deployed backend's `/health`. |
| 14 | Buffer / rest |

**End of week 2 checkpoint:** mock AI-overlay UX works in isolation; Supabase schema + storage exist; both frontend and backend are deployed and talking to each other, even if empty.

---

## Week 3 — App Shell (navigation, auth, Home)

| Day | Task |
|---|---|
| 15 | Install Tailwind + shadcn/ui + React Router in the real app. Build the Sidebar layout (Home, Projects, Smart Review, Progress, Guidelines, Settings) with routing between empty pages. |
| 16 | Build Supabase Auth: signup/login pages, session handling, protected route wrapper (`useRequireAuth`). |
| 17 | Add basic role field (admin/annotator) to `users` table, conditionally hide/show nav items based on role. |
| 18 | Build Home page structure: search bar (UI only, no real query yet), Continue Working section with hardcoded dummy project cards. |
| 19 | Build Learn & Get Started section (static cards: How to annotate, How Smart Review works, Guidelines, Sample images, Best practices) — placeholder content is fine. |
| 20 | Drop your Week 1 `AnnotationCanvas` component into a new (still disconnected) Project Workspace route, with Toolbar UI around it, using a dummy image. |
| 21 | Buffer / rest |

**End of week 3 checkpoint:** the full app is click-through-able — auth works, nav works, Home looks right, workspace route renders the canvas — all still on dummy/hardcoded data.

---

## Week 4 — Real Data Layer (projects, images, uploads)

| Day | Task |
|---|---|
| 22 | Build `POST /projects` and `GET /projects` FastAPI endpoints. Wire Projects page + Home's Continue Working to real Supabase data. |
| 23 | Build image upload flow: frontend → Supabase Storage (raw image) → `POST /images` writes metadata row. Test with a handful of real/sample chest X-rays. |
| 24 | Build `GET /images/:project_id` and the image list/grid UI inside a project. |
| 25 | Wire the Home search bar to a real query (by project name, date, status). |
| 26 | Wire the Project Workspace route to load a real image from Supabase Storage into your `AnnotationCanvas` (still no AI yet — manual annotation only). |
| 27 | Build `POST /annotations` + `GET /annotations/:image_id` — save a manually-drawn mask to Supabase, reload it correctly when reopening the image. |
| 28 | Buffer / rest |

**End of week 4 checkpoint:** you can create a project, upload real images, manually annotate one, save it, and reload it — a fully working manual annotation tool, no AI yet. This alone is demo-able.

---

## Week 5 — Real AI Integration

| Day | Task |
|---|---|
| 29 | Confirm the API contract with Person 3 (input format, output mask format, confidence/uncertainty shape). Get their model checkpoint or a callable interface. |
| 30 | Build `services/model_service.py` wrapping the PyTorch model — `predict(image) -> (mask, confidence)`. Test it standalone with a script, no API yet. |
| 31 | Build `POST /predict` FastAPI endpoint calling `model_service`. Test via `/docs` (Swagger UI) with a sample image. |
| 32 | Wire the frontend: on opening an unreviewed image, call `/predict`, render the real AI mask as the overlay layer (replacing the mock from Week 2). |
| 33 | Wire Accept / Edit buttons to real logic: Accept → save AI mask as the annotation directly; Edit → load AI mask into the canvas as a starting point for correction. |
| 34 | Store AI predictions and human annotations in their separate tables correctly; verify both are queryable and distinct after a full accept/edit cycle. |
| 35 | Buffer / rest |

**End of week 5 checkpoint:** the full AI-predicts → human-reviews loop works end-to-end on real images with the real model.

---

## Week 6 — Smart Review + Progress Dashboard

| Day | Task |
|---|---|
| 36 | Build `services/uncertainty.py` to compute/store an uncertainty score per prediction. Build `GET /review-queue/:project_id` sorted by it. |
| 37 | Build the Smart Review page UI: "N images need your attention" count, list sorted by uncertainty, "Review Next" button. |
| 38 | Wire "Review Next" to jump directly into the Workspace on the top image in the queue. |
| 39 | Build `services/metrics.py` (Dice score between AI mask and human-corrected mask) and `GET /progress/:project_id`. |
| 40 | Build the Progress Dashboard UI with Recharts: reviewed count, accept/correction ratio, Dice trend, cycle number. |
| 41 | Build `review_cycles` logic — increment cycle number at a sensible trigger point (e.g., manually by admin, or after N images reviewed). Keep this simple. |
| 42 | Buffer / rest |

**End of week 6 checkpoint:** the "active learning" identity of the product is visible and working — Smart Review + Progress Dashboard both reflect real data.

---

## Week 7 — Polish, Roles, Integration Testing, Demo Prep

| Day | Task |
|---|---|
| 43 | Build Guidelines/Help static pages with real content (not placeholder). |
| 44 | Build basic Admin views if time allows (manage projects/users) — cut this first if behind schedule. |
| 45 | Add empty states, loading states, and error handling (Sonner toasts) across all pages. |
| 46 | Full end-to-end testing with Person 3's actual latest model output; fix integration bugs. |
| 47 | Responsive/visual polish pass; add Framer Motion touches only if time allows. |
| 48 | Final deploy hardening (env vars, CORS, error logging) + write/rehearse your demo script. |

*(Week 7 only has 6 rows since day 49 would exceed the 7-week window — use any earlier buffer days you didn't need to extend this week if needed.)*

---

## Notes on using this
- If a day's task isn't done, don't skip ahead — use the next buffer day (day 7/14/21/28/35/42) to finish it before moving on. Falling behind by a day compounds fast in a 42-day plan.
- Week 5 (real AI) is the one most dependent on someone else (Person 3) — start the conversation about the API contract in **Week 2**, not Week 5, so you're not blocked.
- If you're ahead of schedule at any checkpoint, pull forward from Week 7 (polish) rather than adding scope — extra polish is always safe to bank early.
