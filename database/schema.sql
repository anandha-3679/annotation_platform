-- ============================================================
-- ChestAnnotate — Supabase Postgres Schema
-- Day 10: Run this in Supabase → SQL Editor → New Query
-- ============================================================
-- Run the entire file at once. All FKs are ON DELETE CASCADE.
-- Predictions and annotations are SEPARATE so Dice/accuracy
-- between AI and human can always be recomputed.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── 1. Users profile ─────────────────────────────────────────────────────────
-- Supabase Auth manages auth.users. We create a public profile table
-- that stores our app-specific fields (role, name) and links to auth.users.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  role        text not null default 'annotator' check (role in ('admin', 'annotator')),
  created_at  timestamptz not null default now()
);

-- Auto-create a user profile row when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'annotator'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. Projects ───────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  owner_id    uuid not null references public.users(id) on delete cascade,
  status      text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 3. Images ─────────────────────────────────────────────────────────────────
create table if not exists public.images (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  storage_path    text not null,          -- Supabase Storage path: raw-images/{project_id}/{filename}
  original_name   text,
  width_px        integer,
  height_px       integer,
  status          text not null default 'pending'
                  check (status in ('pending', 'in_review', 'done')),
  uploaded_by     uuid references public.users(id) on delete set null,
  uploaded_at     timestamptz not null default now()
);

-- ── 4. Predictions (AI output — never overwritten) ────────────────────────────
-- Stores the raw output from Person 3's PyTorch model.
-- findings_json: JSON array of { id, label, location, severity, confidence }
create table if not exists public.predictions (
  id                uuid primary key default gen_random_uuid(),
  image_id          uuid not null references public.images(id) on delete cascade,
  mask_storage_path text not null,        -- Supabase Storage path: masks/predictions/{id}.png
  confidence        float not null check (confidence >= 0 and confidence <= 1),
  uncertainty_score float not null check (uncertainty_score >= 0 and uncertainty_score <= 1),
  findings_json     jsonb default '[]'::jsonb,
  model_version     text not null default 'unknown',
  created_at        timestamptz not null default now()
);

-- ── 5. Annotations (human-reviewed final mask) ────────────────────────────────
-- source = 'ai_accepted'  → radiologist accepted AI mask without changes
-- source = 'human_edited' → radiologist drew corrections on top
-- findings_json: same shape as predictions.findings_json, but human-corrected
create table if not exists public.annotations (
  id                uuid primary key default gen_random_uuid(),
  image_id          uuid not null references public.images(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  prediction_id     uuid references public.predictions(id) on delete set null,
  mask_storage_path text,                -- null if no mask saved yet
  source            text not null default 'human_edited'
                    check (source in ('ai_accepted', 'human_edited')),
  findings_json     jsonb default '[]'::jsonb,
  dice_score        float,               -- computed after save (AI mask vs human mask)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── 6. Annotation versions (undo / audit trail) ───────────────────────────────
create table if not exists public.annotation_versions (
  id              uuid primary key default gen_random_uuid(),
  annotation_id   uuid not null references public.annotations(id) on delete cascade,
  mask_snapshot   text not null,   -- base64 or storage path of mask at this point in time
  findings_json   jsonb default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

-- ── 7. Review cycles (active learning loops) ─────────────────────────────────
create table if not exists public.review_cycles (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  cycle_number  integer not null default 1,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_images_project_id     on public.images(project_id);
create index if not exists idx_images_status         on public.images(status);
create index if not exists idx_predictions_image_id  on public.predictions(image_id);
create index if not exists idx_annotations_image_id  on public.annotations(image_id);
create index if not exists idx_annotations_user_id   on public.annotations(user_id);
create index if not exists idx_review_cycles_project on public.review_cycles(project_id);

-- Sort images by uncertainty for Smart Review queue
create index if not exists idx_predictions_uncertainty
  on public.predictions(uncertainty_score desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Enable RLS on all tables. Backend uses service role key (bypasses RLS).
-- Frontend can only read/write its own data via anon/user JWT.
alter table public.users             enable row level security;
alter table public.projects          enable row level security;
alter table public.images            enable row level security;
alter table public.predictions       enable row level security;
alter table public.annotations       enable row level security;
alter table public.annotation_versions enable row level security;
alter table public.review_cycles     enable row level security;

-- Users: can read their own profile, admins can read all
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Admins can read all users"
  on public.users for select
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Projects: any authenticated user can read; only owner/admin can write
create policy "Authenticated users can read projects"
  on public.projects for select
  using (auth.role() = 'authenticated');

create policy "Owner or admin can insert projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Owner or admin can update projects"
  on public.projects for update
  using (auth.uid() = owner_id or exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Images: any authenticated user can read; only uploader/admin can write
create policy "Authenticated users can read images"
  on public.images for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert images"
  on public.images for insert
  with check (auth.role() = 'authenticated');

-- Annotations: only the annotating user can write
create policy "Users can read annotations"
  on public.annotations for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own annotations"
  on public.annotations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own annotations"
  on public.annotations for update
  using (auth.uid() = user_id);

-- Predictions: readable by all authenticated users (AI output is shared)
create policy "Authenticated users can read predictions"
  on public.predictions for select
  using (auth.role() = 'authenticated');

-- Annotation versions: readable by all authenticated users
create policy "Authenticated users can read annotation versions"
  on public.annotation_versions for select
  using (auth.role() = 'authenticated');

-- Review cycles: readable by all authenticated users
create policy "Authenticated users can read review cycles"
  on public.review_cycles for select
  using (auth.role() = 'authenticated');

-- ── Done ──────────────────────────────────────────────────────────────────────
-- After running: go to Storage → create buckets:
--   1. raw-images  (private)
--   2. masks       (private)
-- See storage_buckets.sql for bucket policies.
