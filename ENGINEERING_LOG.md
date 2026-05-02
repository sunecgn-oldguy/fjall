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

---

## 2026-05-02 — Fase 3: Interaktivt kort med GPS og live positionsdeling

**Hvad:** Interaktivt kort med Leaflet, brugerens GPS-position og live positionsdeling mellem gruppemedlemmer via Supabase Realtime.

**Beslutninger:**
- **Leaflet** via react-leaflet — simpelt, veldokumenteret, godt nok til MVP. MapLibre er overkill her
- **OpenTopoMap** tiles — viser højdekurver og terræn, vigtigt for bjergterræn på Færøerne
- **CircleMarker** i stedet for standard Marker — undgår et kendt Leaflet-ikonproblem med bundlers (Vite)
- **Supabase Realtime** for live positioner — bruger eksisterende Supabase-opsætning, ingen ekstra server
- **5-sekunders throttling** på GPS-opdateringer til databasen — sparer batteri og database
- **Stale-filtrering** — positioner ældre end 5 minutter filtreres automatisk væk
- **Kortet er offentligt** — alle kan se kortet, men GPS-deling kræver login
- **Numeriske fejlkoder** i useGeolocation — `GeolocationPositionError`-konstanter eksisterer ikke i jsdom-testmiljø, så vi bruger de numeriske værdier (1, 2, 3) direkte

**Nye filer (8 stk):**
- `src/features/map/MapView.tsx` — Leaflet MapContainer med OpenTopoMap tiles, centreret på Færøerne
- `src/features/map/LocationMarker.tsx` — Brugerens GPS-position (blå CircleMarker + nøjagtighedscirkel, flyTo ved første fix)
- `src/features/map/GroupMembersLayer.tsx` — Andre medlemmers positioner (røde CircleMarker med permanente Tooltip)
- `src/features/map/GroupSelector.tsx` — Dropdown overlay til at vælge aktiv gruppe, auto-vælger første
- `src/features/map/useGeolocation.ts` — Hook der wrapper browser Geolocation API med færøske fejlmeddelelser
- `src/features/map/useGroupLocations.ts` — Hook for Supabase upsert (throttled) + Realtime subscription + cleanup
- `src/features/map/useGeolocation.test.ts` — 6 unit-tests for GPS-hooken (position, fejl, cleanup, manglende API)
- `supabase/migrations/002_locations.sql` — locations-tabel med composite PK, RLS-policies og Realtime

**Ændrede filer (5 stk):**
- `package.json` — +leaflet, +react-leaflet, +@types/leaflet
- `src/types/database.ts` — +Location interface
- `src/features/map/MapPage.tsx` — Erstattet placeholder med rigtigt kort, GPS-status, gruppevælger, login-opfordring
- `src/components/Layout.tsx` — Fuld bredde/højde for /kort, skjult footer, bruger useLocation()
- `src/index.css` — +leaflet container height/width fix
- `src/App.test.tsx` — Mock MapView (Leaflet virker ikke i jsdom), opdateret kort-test til data-testid

**Verifikation:**
- `npm run build` bygger uden fejl (chunk-størrelses-advarsel for Leaflet er forventet)
- `npm run test` kører 10 tests der alle består (4 App + 6 useGeolocation)
- Kortet viser Færøerne med topografiske tiles
- GPS-position vises som blå prik med nøjagtighedscirkel
- Gruppevælger viser brugerens grupper
- Andre gruppemedlemmers positioner vises som røde prikker med navne
- Login-opfordring vises for ikke-loggede brugere

**Næste skridt (Fase 4):**
- Fåre-markering på kortet
- Ordrer og anvisninger

---

## 2026-05-02 — Fase 4: Seyðamerking og ávísingar

**Hvad:** Tilføjet fåre-observationer (sheep sightings) og ordrer/anvisninger (orders) — de to vigtigste koordineringsværktøjer under en seyðadriv.

**Beslutninger:**
- **Tap-på-kort** til positionsvalg — brugeren trykker på kortet for at placere en observation/ordre, i stedet for kun at bruge GPS-position
- **State-maskine** i MapPage — idle → placing-sighting → sighting-form → idle (og tilsvarende for ordrer). Sikrer kun én aktiv interaktion ad gangen
- **Farvekoder:** grøn = fåre-observationer, orange = ordrer, blå = egen position, rød = gruppemedlemmer
- **Opacity-fade** på observationer — lineær fade fra 0.9 → 0.25 over 2 timer mod udløb
- **Alle gruppemedlemmer kan resolve** observationer og acceptere/fuldføre ordrer — under en seyðadriv er det vigtigt at alle kan handle hurtigt
- **Periodisk klient-side oprydning** af udløbne observationer (hvert 30 sek) — undgår at vise forældede prikker
- **Ingen push-notifikationer** — det er Fase 6 (PWA). Ordrer vises kun in-app
- **Store touch-targets** (56px knap, 10-12 radius) — mobil-first for brug med handsker/regn
- **Én SQL-migration** for begge tabeller — de hører til samme fase

**Nye filer (9 stk):**
- `supabase/migrations/003_sightings_and_orders.sql` — DB-tabeller: sheep_sightings + orders med RLS + Realtime
- `src/features/map/useSheepSightings.ts` — Hook: fetch, Realtime, add, resolve observationer
- `src/features/map/useOrders.ts` — Hook: fetch, Realtime, add, accept, complete, cancel ordrer
- `src/features/map/SheepSightingsLayer.tsx` — Grønne CircleMarker med antal-tooltip, opacity-fade
- `src/features/map/OrdersLayer.tsx` — Orange CircleMarker med besked-tooltip og status-knapper
- `src/features/map/MapActionButton.tsx` — Flydende "+"-knap med undermenu (merkja seyðir / gev ávísing)
- `src/features/map/AddSightingPanel.tsx` — Bottom-panel: antal (+/- knapper), kompasretning (8 retninger), note
- `src/features/map/AddOrderPanel.tsx` — Bottom-panel: beskedstekst + valgfri dropdown med gruppemedlemmer
- `src/features/map/MapTapHandler.tsx` — Lytter på kort-tap for positionsvalg (useMapEvents)

**Ændrede filer (3 stk):**
- `src/types/database.ts` — +SheepSighting og +Order interfaces
- `src/features/map/MapPage.tsx` — Komplet omskrivning med state-maskine, nye hooks/lag/overlays, action button
- `src/App.test.tsx` — Tilføjet react-leaflet mock for at undgå useMapEvents-kontekstfejl

**Database-design:**
- `sheep_sightings` — id, group_id, user_id, lat/lng, count, direction (0-359), note, status (active/resolved), created_at, expires_at (default 2 timer)
- `orders` — id, group_id, created_by, assigned_to (nullable), lat/lng, message, status (pending/accepted/completed/cancelled), created_at
- RLS: bruger `user_group_ids()` fra migration 001, gruppemedlemmer kan se/oprette/opdatere, kun opretteren kan slette

**Verifikation:**
- `npm run build` bygger uden fejl
- `npm run test` kører 10 tests der alle består
- Fåre-observationer kan oprettes via kort-tap og vises som grønne prikker med fade
- Ordrer kan oprettes, tildeles, accepteres og fuldføres
- "+"-knappen er stor nok til touch med handsker

**Næste skridt (Fase 5):**
- Chat/beskeder mellem gruppemedlemmer
- Eventuelt UI-polish og edge-case-håndtering
