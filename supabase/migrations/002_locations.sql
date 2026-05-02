-- =============================================================
-- Fase 3: Locations-tabel for live GPS-positionsdeling
-- =============================================================
-- Kør denne SQL i Supabase SQL Editor (https://supabase.com/dashboard)
-- Tabellen bruger (user_id, group_id) som composite primary key,
-- så hver bruger kun har én aktiv position per gruppe.

-- 1. Opret locations-tabel
create table if not exists public.locations (
  user_id    uuid references auth.users(id) on delete cascade,
  group_id   uuid references public.groups(id) on delete cascade,
  latitude   double precision not null,
  longitude  double precision not null,
  accuracy   double precision,
  heading    double precision,
  speed      double precision,
  updated_at timestamptz not null default now(),

  primary key (user_id, group_id)
);

-- 2. Index for hurtige opslag per gruppe
create index if not exists idx_locations_group_id
  on public.locations(group_id);

-- 3. RLS (Row Level Security) — bruger eksisterende user_group_ids() funktion
alter table public.locations enable row level security;

-- Brugere kan kun indsætte/opdatere deres egen position
create policy "Brugere kan upserte egen position"
  on public.locations
  for insert
  with check (
    auth.uid() = user_id
    and group_id in (select user_group_ids())
  );

create policy "Brugere kan opdatere egen position"
  on public.locations
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and group_id in (select user_group_ids())
  );

-- Brugere kan se positioner fra deres egne grupper
create policy "Brugere kan se positioner i egne grupper"
  on public.locations
  for select
  using (group_id in (select user_group_ids()));

-- Brugere kan slette deres egen position (ved logout/unmount)
create policy "Brugere kan slette egen position"
  on public.locations
  for delete
  using (auth.uid() = user_id);

-- 4. Aktivér Supabase Realtime for locations-tabellen
alter publication supabase_realtime add table public.locations;
