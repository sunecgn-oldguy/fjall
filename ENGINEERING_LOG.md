# Engineering Log — Fjall / Seyðadriv Coordinator

Denne log dokumenterer alle vigtige beslutninger, ændringer og fremskridt i projektet.

---

## 2026-04-30 — Projekt oprettet

**Hvad:** Projektspecifikation defineret og gennemgået.

**Beslutninger:**
- Tech stack: React 18 + Vite + TypeScript, Supabase, React-Leaflet, Tailwind + shadcn/ui
- PWA med offline-first tilgang
- UI-sprog: færøsk
- Kommunikation og dokumentation: dansk

**Åbne spørgsmål:**
- Leaflet vs. MapLibre GL JS (vector tile support)
- Offline-strategi og konflikthåndtering ved synkronisering
- MVP-scope: skal playback og højdeprofil være med i første version?

**Næste skridt:**
- Opsæt projektstruktur og udviklingsmiljø
- Opsæt Supabase-projekt
- Byg fundament: auth, gruppe, live GPS-kort

---

## 2026-05-01 — Fase 1: Projektfundament

**Hvad:** Opsætning af projektstruktur, udviklingsværktøjer og en simpel startside.

**Beslutninger:**
- **React 19** (nyeste stabile) i stedet for React 18 — Vite-skabelonen bruger 19 som standard
- **Tailwind CSS v4** med `@tailwindcss/vite` plugin — nyere, hurtigere end v3, integrerer direkte med Vite
- **React Router v7** — standard for klient-side navigation i React
- **Vitest v4** med jsdom + Testing Library — hurtigere end Jest, integrerer med Vite-konfigurationen
- **Mappestruktur:** `features/`-baseret (auth, drive, map, orders) for at holde koden organiseret per funktionsområde
- **UI-sprog:** Færøsk på alle brugervendte sider, dansk i dokumentation
- **GitHub repo:** `sunecgn-oldguy/fjall` (public)

**Hvad blev lavet:**
- Vite-projekt oprettet med React + TypeScript skabelon
- Tailwind CSS v4 konfigureret med Vite-plugin
- React Router med Layout-komponent (header, navigation, footer)
- To sider: Forsíða (velkomst + næste skridt) og Kort (placeholder)
- Vitest med 2 smoke-tests der bekræfter routing virker
- `.env.example` med Supabase-placeholder-variabler
- `.gitignore` med beskyttelse af `.env`-filer
- `README.md` med projektbeskrivelse og scripts

**Verifikation:**
- `npm run build` bygger uden fejl
- `npm run test` kører 2 tests der begge består
- Mappestrukturen er ren og logisk

**Næste skridt (Fase 2):**
- Opret Supabase-konto og projekt
- Opsæt authentication (login/registrering)
- Gruppe-oprettelse og -administration

---

## 2026-05-01 — Fase 2: Supabase + Auth + Grupper

**Hvad:** Backend-integration med Supabase — authentication og gruppe-administration.

**Beslutninger:**
- **Supabase** som backend (BaaS — Backend as a Service) — PostgreSQL database, authentication og RLS (Row Level Security) out of the box
- **Kun email/password auth** — social login (Google/Apple) tilføjes ikke endnu
- **Profiler-tabel** udover `auth.users` — giver `display_name` og mulighed for fremtidige felter
- **6-cifret join-kode** til grupper — simpelt og nemt at dele mundtligt under fåredrivning
- **RLS policies** sikrer at brugere kun kan se/ændre data de har adgang til
- **Database trigger** opretter automatisk en profil når en ny bruger registrerer sig
- **AuthContext** med React Context — holder auth-state globalt uden prop-drilling
- **ProtectedRoute** wrapper — omdirigerer til login for beskyttede sider
- **Ekstra select-policy** på groups-tabellen for join_code-opslag — uden den kunne brugere ikke finde grupper via kode
- **RLS-rekursion fix** — de oprindelige policies på `group_members` refererede sig selv, hvilket gav "infinite recursion". Løst med en `security definer`-funktion (`user_group_ids`) der omgår RLS-tjekket

**Nye filer:**
- `src/features/auth/AuthContext.tsx` — React Context med auth-state og login/signup/logout
- `src/features/auth/LoginPage.tsx` — Login-formular (email/password)
- `src/features/auth/RegisterPage.tsx` — Registrerings-formular (navn/email/password)
- `src/features/auth/ProtectedRoute.tsx` — Beskyttet rute-wrapper
- `src/features/groups/GroupsPage.tsx` — Oversigt over brugerens grupper
- `src/features/groups/CreateGroupForm.tsx` — Opret ny gruppe
- `src/features/groups/JoinGroupForm.tsx` — Deltag i gruppe via 6-cifret kode
- `src/types/database.ts` — TypeScript-typer for Profile, Group, GroupMember
- `supabase/migrations/001_initial_schema.sql` — SQL-schema til reference

**Ændrede filer:**
- `src/lib/supabase.ts` — Fra tom stub til rigtig Supabase-klient
- `src/App.tsx` — Nye ruter: /login, /register, /bolkar (beskyttet)
- `src/main.tsx` — Wrapped med AuthProvider
- `src/components/Layout.tsx` — Login/logout knap + Bólkar nav-link
- `src/App.test.tsx` — Opdateret med AuthProvider mock + 2 nye tests

**Verifikation:**
- `npm run build` bygger uden fejl
- `npm run test` kører 4 tests der alle består
- Auth-system klar til manuel test (kræver at SQL køres i Supabase)

**Næste skridt (Fase 3):**
- Leaflet-kort med GPS-tracking
- Live position-deling mellem gruppemedlemmer
