-- Fjall — Fase 2: Initial database schema
-- Kør dette SQL i Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Tabeller: profiles, groups, group_members
-- Inkluderer RLS (Row Level Security) policies og auto-profil trigger.

-- ============================================================
-- Profiler (udvider Supabase auth.users med display_name)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- ============================================================
-- Grupper
-- ============================================================
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text unique not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.groups enable row level security;

-- ============================================================
-- Gruppemedlemmer (junction-tabel mellem groups og profiles)
-- ============================================================
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now() not null,
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- ============================================================
-- Trigger: Opret profil automatisk når en bruger registrerer sig
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Brúkari'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Hjælpefunktion: Returnerer gruppe-IDs for en bruger.
-- Bruger security definer for at undgå uendelig RLS-rekursion
-- når group_members-policies slår op i sig selv.
-- ============================================================
create or replace function public.user_group_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select group_id from public.group_members where user_id = uid;
$$;

-- ============================================================
-- RLS Policies (Row Level Security — bestemmer hvem der kan se/ændre data)
-- ============================================================

-- Profiler: alle autentificerede brugere kan se profiler, kun egne kan redigeres
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Grupper: alle autentificerede kan se grupper (nødvendig for join_code-opslag)
create policy "Authenticated users can view groups"
  on public.groups for select to authenticated
  using (true);

create policy "Authenticated users can create groups"
  on public.groups for insert to authenticated
  with check (auth.uid() = created_by);

-- Gruppemedlemmer: kan se medlemmer i egne grupper, kan join, admins kan fjerne
create policy "Members can view group members"
  on public.group_members for select to authenticated
  using (group_id in (select public.user_group_ids(auth.uid())));

create policy "Users can join groups"
  on public.group_members for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can remove members"
  on public.group_members for delete to authenticated
  using (group_id in (
    select group_id from public.group_members
    where user_id = auth.uid() and role = 'admin'
  ));
