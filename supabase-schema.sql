-- ============================================================
--  The Offside Club: Supabase setup
--  Run this ONCE in your Supabase dashboard: SQL Editor > New query > Run.
--  Safe to re-run; every statement is guarded.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- Editable text/labels across the site. One row per editable field.
create table if not exists public.content (
  key         text primary key,
  value       text not null default '',
  updated_at  timestamptz not null default now()
);

-- Gallery photos.
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,             -- object path inside the 'media' bucket
  caption     text default '',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists photos_sort_idx on public.photos (sort_order, created_at desc);

-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
--    This is the important part. The anon key is PUBLIC and ships
--    inside your JavaScript, so the database itself must enforce
--    that visitors can only read, never write.
-- ------------------------------------------------------------

alter table public.content enable row level security;
alter table public.photos  enable row level security;

-- Anyone (including logged-out visitors) may READ.
drop policy if exists "content readable by everyone" on public.content;
create policy "content readable by everyone"
  on public.content for select
  to anon, authenticated
  using (true);

drop policy if exists "photos readable by everyone" on public.photos;
create policy "photos readable by everyone"
  on public.photos for select
  to anon, authenticated
  using (true);

-- Only a signed-in admin may WRITE. anon is deliberately excluded.
drop policy if exists "content writable by authenticated" on public.content;
create policy "content writable by authenticated"
  on public.content for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "photos writable by authenticated" on public.photos;
create policy "photos writable by authenticated"
  on public.photos for all
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- 3. STORAGE BUCKET for images
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Public read of the bucket, authenticated-only write.
drop policy if exists "media readable by everyone" on storage.objects;
create policy "media readable by everyone"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media writable by authenticated" on storage.objects;
create policy "media writable by authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media updatable by authenticated" on storage.objects;
create policy "media updatable by authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "media deletable by authenticated" on storage.objects;
create policy "media deletable by authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');

-- ------------------------------------------------------------
-- 4. Keep updated_at honest
-- ------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists content_touch on public.content;
create trigger content_touch
  before update on public.content
  for each row execute function public.touch_updated_at();

-- ============================================================
--  AFTER RUNNING THIS:
--  1. Authentication > Users > "Add user" -> create your admin
--     email + password. Tick "Auto Confirm User".
--  2. Authentication > Providers > Email: turn OFF "Enable sign ups"
--     so nobody can register themselves an admin account.
--  3. Open /admin.html on the site and log in.
-- ============================================================
