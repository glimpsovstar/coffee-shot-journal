-- Café catalogue (P3 extension)

create table if not exists public.cafes (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  document jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists cafes_user_id_idx on public.cafes (user_id);

alter table public.cafes enable row level security;

create policy "cafes_select_own"
  on public.cafes for select
  using (auth.uid() = user_id);

create policy "cafes_insert_own"
  on public.cafes for insert
  with check (auth.uid() = user_id);

create policy "cafes_update_own"
  on public.cafes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cafes_delete_own"
  on public.cafes for delete
  using (auth.uid() = user_id);
