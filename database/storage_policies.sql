-- ============================================================
-- ChestAnnotate — Supabase Storage Bucket Policies
-- Day 11: Run this AFTER creating buckets in Supabase dashboard
-- ============================================================
-- Before running this SQL:
--   1. Go to Supabase → Storage → New bucket → "raw-images" (Private)
--   2. Go to Supabase → Storage → New bucket → "masks" (Private)
-- Then run this file in SQL Editor.
-- ============================================================

-- ── raw-images bucket ─────────────────────────────────────────────────────────
-- Authenticated users can upload images
create policy "Authenticated users can upload raw images"
  on storage.objects for insert
  with check (
    bucket_id = 'raw-images'
    and auth.role() = 'authenticated'
  );

-- Authenticated users can view/download images
create policy "Authenticated users can read raw images"
  on storage.objects for select
  using (
    bucket_id = 'raw-images'
    and auth.role() = 'authenticated'
  );

-- Only uploader or admin can delete
create policy "Uploader or admin can delete raw images"
  on storage.objects for delete
  using (
    bucket_id = 'raw-images'
    and (
      auth.uid() = owner
      or exists (
        select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
      )
    )
  );

-- ── masks bucket ─────────────────────────────────────────────────────────────
-- Backend (service role) writes masks; authenticated users can read
create policy "Authenticated users can read masks"
  on storage.objects for select
  using (
    bucket_id = 'masks'
    and auth.role() = 'authenticated'
  );

-- Authenticated users can upload their own mask corrections
create policy "Authenticated users can upload masks"
  on storage.objects for insert
  with check (
    bucket_id = 'masks'
    and auth.role() = 'authenticated'
  );
