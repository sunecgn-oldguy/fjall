-- =============================================================
-- Fase 5: Skilaboð (gruppechat / beskeder)
-- =============================================================
-- Kør denne SQL i Supabase SQL Editor (https://supabase.com/dashboard)
-- En tabel: messages — korte tekstbeskeder mellem gruppemedlemmer.
-- Bruger user_group_ids() fra migration 001 til RLS.

-- =============================================================
-- 1. messages — chatbeskeder i en gruppe
-- =============================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null check (char_length(text) >= 1),
  created_at timestamptz not null default now()
);

-- Sammensat indeks for hurtig hentning af seneste beskeder per gruppe
create index if not exists idx_messages_group_created
  on public.messages(group_id, created_at);

-- =============================================================
-- 2. Row Level Security
-- =============================================================
alter table public.messages enable row level security;

-- Alle gruppemedlemmer kan se beskeder i deres grupper
create policy "Medlemmer kan se beskeder i egne grupper"
  on public.messages
  for select
  using (group_id in (select public.user_group_ids(auth.uid())));

-- Medlemmer kan sende beskeder i deres grupper
create policy "Medlemmer kan sende beskeder"
  on public.messages
  for insert
  with check (
    auth.uid() = user_id
    and group_id in (select public.user_group_ids(auth.uid()))
  );

-- Kun afsenderen kan slette egen besked (fremtidig brug)
create policy "Afsenderen kan slette egen besked"
  on public.messages
  for delete
  using (auth.uid() = user_id);

-- =============================================================
-- 3. Aktivér Supabase Realtime
-- =============================================================
alter publication supabase_realtime add table public.messages;
