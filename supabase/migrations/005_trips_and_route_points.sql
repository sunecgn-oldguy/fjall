-- Fjall — Fase 8: Ture (trips) og rutepunkter (route_points)
-- Kør dette SQL i Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Tabeller: trips, route_points
-- trips = en tur startet af én bruger i én gruppe
-- route_points = GPS-positioner optaget under en tur

-- ============================================================
-- Ture — en seyðadriv-tur startet af én bruger i én gruppe
-- ============================================================
create table public.trips (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid references public.groups(id) on delete cascade not null,
  started_by uuid references auth.users(id) on delete cascade not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,            -- null = stadig aktiv
  name       text not null default '' -- valgfrit navn, f.eks. "Vestmanna-turen 2. mai"
);

-- Indeks for hurtig opslag af ture i en gruppe (nyeste først)
create index idx_trips_group_started
  on public.trips(group_id, started_at desc);

alter table public.trips enable row level security;

-- Gruppemedlemmer kan se alle ture i deres grupper
create policy "Gruppemedlemmer kan se ture"
  on public.trips for select to authenticated
  using (group_id in (select public.user_group_ids(auth.uid())));

-- Gruppemedlemmer kan starte en tur (kun som sig selv)
create policy "Gruppemedlemmer kan starte ture"
  on public.trips for insert to authenticated
  with check (
    auth.uid() = started_by
    and group_id in (select public.user_group_ids(auth.uid()))
  );

-- Kun den der startede turen kan afslutte den (sætte ended_at)
create policy "Opretteren kan afslutte tur"
  on public.trips for update to authenticated
  using (auth.uid() = started_by)
  with check (auth.uid() = started_by);

-- Aktivér Realtime på trips så alle ser når en tur startes/stoppes
alter publication supabase_realtime add table public.trips;

-- ============================================================
-- Rutepunkter — GPS-positioner optaget under en tur
-- ============================================================
create table public.route_points (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid references public.trips(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  latitude    double precision not null,
  longitude   double precision not null,
  recorded_at timestamptz not null default now()
);

-- Sammensat indeks for effektiv hentning af en brugers rute i en tur
create index idx_route_points_trip_user_time
  on public.route_points(trip_id, user_id, recorded_at);

alter table public.route_points enable row level security;

-- Alle gruppemedlemmer kan se rutepunkter (via trip → group_id → membership)
create policy "Gruppemedlemmer kan se rutepunkter"
  on public.route_points for select to authenticated
  using (
    trip_id in (
      select t.id from public.trips t
      where t.group_id in (select public.user_group_ids(auth.uid()))
    )
  );

-- Brugere kan kun indsætte egne rutepunkter
create policy "Brugere kan indsætte egne rutepunkter"
  on public.route_points for insert to authenticated
  with check (
    auth.uid() = user_id
    and trip_id in (
      select t.id from public.trips t
      where t.group_id in (select public.user_group_ids(auth.uid()))
    )
  );

-- Realtime er IKKE nødvendig på route_points — ruter hentes ved polling
