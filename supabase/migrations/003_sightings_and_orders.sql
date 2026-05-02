-- =============================================================
-- Fase 4: Seyðamerking (fåre-observationer) og ávísingar (ordrer)
-- =============================================================
-- Kør denne SQL i Supabase SQL Editor (https://supabase.com/dashboard)
-- To tabeller: sheep_sightings (hvor får er set) og orders (gå-hertil kommandoer).
-- Begge bruger user_group_ids() fra migration 001 til RLS.

-- =============================================================
-- 1. sheep_sightings — fåre-observationer fra gruppen
-- =============================================================
create table if not exists public.sheep_sightings (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  latitude   double precision not null,
  longitude  double precision not null,
  count      integer not null check (count > 0),
  direction  integer check (direction >= 0 and direction < 360),
  note       text default '',
  status     text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

-- Indeks for hurtige opslag per gruppe
create index if not exists idx_sightings_group_id
  on public.sheep_sightings(group_id);

-- Indeks for at filtrere på status
create index if not exists idx_sightings_status
  on public.sheep_sightings(status);

-- RLS
alter table public.sheep_sightings enable row level security;

-- Alle gruppemedlemmer kan se observationer i deres grupper
create policy "Medlemmer kan se observationer i egne grupper"
  on public.sheep_sightings
  for select
  using (group_id in (select public.user_group_ids(auth.uid())));

-- Medlemmer kan oprette observationer i deres grupper
create policy "Medlemmer kan oprette observationer"
  on public.sheep_sightings
  for insert
  with check (
    auth.uid() = user_id
    and group_id in (select public.user_group_ids(auth.uid()))
  );

-- Alle gruppemedlemmer kan markere en observation som resolved
create policy "Medlemmer kan opdatere observationer i egne grupper"
  on public.sheep_sightings
  for update
  using (group_id in (select public.user_group_ids(auth.uid())));

-- Kun opretteren kan slette en observation
create policy "Opretteren kan slette egen observation"
  on public.sheep_sightings
  for delete
  using (auth.uid() = user_id);

-- =============================================================
-- 2. orders — ordrer/ávísingar til gruppemedlemmer
-- =============================================================
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  created_by  uuid not null references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  latitude    double precision not null,
  longitude   double precision not null,
  message     text not null,
  status      text not null default 'pending'
    check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  created_at  timestamptz not null default now()
);

-- Indeks for hurtige opslag per gruppe
create index if not exists idx_orders_group_id
  on public.orders(group_id);

-- Indeks for at filtrere på status
create index if not exists idx_orders_status
  on public.orders(status);

-- RLS
alter table public.orders enable row level security;

-- Alle gruppemedlemmer kan se ordrer i deres grupper
create policy "Medlemmer kan se ordrer i egne grupper"
  on public.orders
  for select
  using (group_id in (select public.user_group_ids(auth.uid())));

-- Medlemmer kan oprette ordrer i deres grupper
create policy "Medlemmer kan oprette ordrer"
  on public.orders
  for insert
  with check (
    auth.uid() = created_by
    and group_id in (select public.user_group_ids(auth.uid()))
  );

-- Alle gruppemedlemmer kan opdatere ordrer (accept, complete, cancel)
create policy "Medlemmer kan opdatere ordrer i egne grupper"
  on public.orders
  for update
  using (group_id in (select public.user_group_ids(auth.uid())));

-- Kun opretteren kan slette en ordre
create policy "Opretteren kan slette egen ordre"
  on public.orders
  for delete
  using (auth.uid() = created_by);

-- =============================================================
-- 3. Aktivér Supabase Realtime for begge tabeller
-- =============================================================
alter publication supabase_realtime add table public.sheep_sightings;
alter publication supabase_realtime add table public.orders;
