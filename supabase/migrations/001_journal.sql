-- Coffee Shot Journal — cloud schema (P3)
-- Run in Supabase SQL Editor after creating the project.
-- Policies use drop-if-exists so Supabase Preview branches can re-apply migrations.

-- Beans and shots stored as JSON documents matching app types.
create table if not exists public.beans (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  document jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.shots (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  document jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists beans_user_id_idx on public.beans (user_id);
create index if not exists shots_user_id_idx on public.shots (user_id);

alter table public.beans enable row level security;
alter table public.shots enable row level security;

drop policy if exists "beans_select_own" on public.beans;
create policy "beans_select_own"
  on public.beans for select
  using (auth.uid() = user_id);

drop policy if exists "beans_insert_own" on public.beans;
create policy "beans_insert_own"
  on public.beans for insert
  with check (auth.uid() = user_id);

drop policy if exists "beans_update_own" on public.beans;
create policy "beans_update_own"
  on public.beans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "beans_delete_own" on public.beans;
create policy "beans_delete_own"
  on public.beans for delete
  using (auth.uid() = user_id);

drop policy if exists "shots_select_own" on public.shots;
create policy "shots_select_own"
  on public.shots for select
  using (auth.uid() = user_id);

drop policy if exists "shots_insert_own" on public.shots;
create policy "shots_insert_own"
  on public.shots for insert
  with check (auth.uid() = user_id);

drop policy if exists "shots_update_own" on public.shots;
create policy "shots_update_own"
  on public.shots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "shots_delete_own" on public.shots;
create policy "shots_delete_own"
  on public.shots for delete
  using (auth.uid() = user_id);

-- Private photo bucket: paths `{user_id}/{photo_id}`
insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

drop policy if exists "journal_photos_select_own" on storage.objects;
create policy "journal_photos_select_own"
  on storage.objects for select
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "journal_photos_insert_own" on storage.objects;
create policy "journal_photos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'journal-photos'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "journal_photos_update_own" on storage.objects;
create policy "journal_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "journal_photos_delete_own" on storage.objects;
create policy "journal_photos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername (name))[1] = auth.uid()::text
  );
