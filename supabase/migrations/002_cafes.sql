-- Café catalogue (P3 extension)
-- Policies use drop-if-exists so Supabase Preview branches can re-apply migrations.

create table if not exists public.cafes (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  document jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists cafes_user_id_idx on public.cafes (user_id);

alter table public.cafes enable row level security;

drop policy if exists "cafes_select_own" on public.cafes;
create policy "cafes_select_own"
  on public.cafes for select
  using (auth.uid() = user_id);

drop policy if exists "cafes_insert_own" on public.cafes;
create policy "cafes_insert_own"
  on public.cafes for insert
  with check (auth.uid() = user_id);

drop policy if exists "cafes_update_own" on public.cafes;
create policy "cafes_update_own"
  on public.cafes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cafes_delete_own" on public.cafes;
create policy "cafes_delete_own"
  on public.cafes for delete
  using (auth.uid() = user_id);
