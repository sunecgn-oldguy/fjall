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

---

## 2026-05-02 — Fase 5: Skilaboð (gruppechat)

**Hvad:** Tilføjet en simpel gruppechat så medlemmerne kan kommunikere under en seyðadriv — korte, hurtige beskeder som "Eg síggi 3 seyðir við ána" eller "Bíða lítið".

**Beslutninger:**
- **Ny side `/skilabod`** (færøsk for "beskeder") — beskyttet rute, fuld højde som kortsiden
- **Genbruger GroupSelector** fra kortsiden — brugeren vælger hvilken gruppe de chatter i
- **Kun tekst** — ingen billeder, filer, reaktioner eller tråde. Fokus på feltarbejde
- **Seneste 50 beskeder** ved indlæsning — nok kontekst uden at overfylde
- **Realtime via Supabase** — følger eksakt samme mønster som sightings/orders hooks (postgres_changes INSERT)
- **Auto-scroll** til bunden ved nye beskeder via `useRef` + `scrollIntoView`
- **Chat-boble layout:** egne beskeder til højre (blå), andres til venstre (grå) med afsendernavn
- **Sammensat indeks** `(group_id, created_at)` for hurtig hentning af seneste beskeder
- **Ingen update-policy** — beskeder kan ikke redigeres (simpelt, feltarbejde-fokus)

**Nye filer (4 stk):**
- `supabase/migrations/004_messages.sql` — messages-tabel med RLS, sammensat indeks, Realtime
- `src/features/chat/useMessages.ts` — Hook: fetch seneste 50, Realtime subscription, sendMessage()
- `src/features/chat/ChatPage.tsx` — Fuld chatside: gruppevælger, beskedliste med auto-scroll, input-bar
- `src/features/chat/MessageBubble.tsx` — Chat-boble med navn, tekst, tidspunkt, isMine-baseret styling

**Ændrede filer (3 stk):**
- `src/types/database.ts` — +Message interface
- `src/App.tsx` — +beskyttet rute `/skilabod` → ChatPage
- `src/components/Layout.tsx` — +nav-link "Skilaboð", `isFullHeight` for chat-ruten (som /kort)

**Database-design:**
- `messages` — id (uuid PK), group_id (FK → groups), user_id (FK → auth.users), text (NOT NULL, mindst 1 tegn), created_at
- RLS: gruppemedlemmer kan se + sende, kun afsenderen kan slette
- Sammensat indeks: `(group_id, created_at)` for effektiv paginering

**Verifikation:**
- `npm run build` bygger uden fejl
- `npm run test` kører 10 tests der alle består
- Chat-rute kræver login (ProtectedRoute)
- Beskeder hentes og vises i chat-rækkefølge
- Realtime subscription lytter på nye INSERT-events
- Egne beskeder: blå boble til højre. Andres: grå boble med navn til venstre
- Auto-scroll virker ved nye beskeder

**Næste skridt (Fase 6):**
- PWA — installerbar app

---

## 2026-05-02 — Fase 6: PWA (installerbar app)

**Hvad:** Gjort appen installerbar som PWA — brugere kan tilføje den til hjemmeskærmen og få en app-lignende oplevelse med fuld skærm og cached assets.

**Beslutninger:**
- **vite-plugin-pwa** med `generateSW` — automatisk genereret service worker, ingen custom SW-kode. Simpelt og vedligeholdelsesfrit
- **`registerType: "autoUpdate"`** — service workeren opdaterer sig selv automatisk ved nye deploys. Brugere får altid nyeste version
- **Precache statiske assets** (JS, CSS, HTML, ikoner) — app-skallen indlæses fra cache = hurtig start
- **Runtime caching af korttiles** — OpenTopoMap tiles caches med CacheFirst-strategi (max 500 tiles, 30 dages levetid)
- **Ingen Supabase API-caching** — realtime-data skal altid være frisk, WebSockets går ikke gennem service worker
- **Ikon-generering** med `sharp` — simpel SVG med "F" på stone-800 baggrund, konverteret til PNG i 3 størrelser
- **Farvetema:** `#292524` (stone-800, headerens farve) som theme-color og ikon-baggrund
- **`--legacy-peer-deps`** ved installation — vite-plugin-pwa 1.2.0 deklarerer kun support for Vite ≤7, men virker med Vite 8 da plugin-API'et er stabilt
- **`@testing-library/dom`** tilføjet som devDependency — manglende peer dep der forårsagede TypeScript build-fejl

**Hvad der IKKE er med:**
- Push-notifikationer (kræver server-side VAPID-nøgler og Edge Functions)
- Fuld offline-mode med synkroniseringskø
- Background sync
- Custom offline-side

**Nye filer (4 stk):**
- `scripts/generate-icons.mjs` — Node-script der genererer PNG-ikoner fra SVG via sharp
- `public/pwa-192x192.png` — PWA-ikon 192×192 (Android/Chrome)
- `public/pwa-512x512.png` — PWA-ikon 512×512 (splash screen + maskable)
- `public/apple-touch-icon-180x180.png` — Apple touch-ikon 180×180 (iOS Safari)

**Ændrede filer (3 stk):**
- `package.json` — +vite-plugin-pwa, +sharp, +@testing-library/dom (devDependencies)
- `vite.config.ts` — +VitePWA plugin med manifest, workbox precaching og tile-caching
- `index.html` — +PWA metatags (description, theme-color, apple-touch-icon)

**Service Worker konfiguration:**
- Precache: `**/*.{js,css,html,ico,png,svg,woff,woff2}` — 11 entries (657 KiB)
- Runtime cache: `tile.opentopomap.org` tiles med CacheFirst (max 500, 30 dage)
- Manifest: standalone display, færøsk description, 3 ikoner (192, 512, 512 maskable)

**Verifikation:**
- `npm run build` bygger uden fejl og genererer `dist/sw.js` + `dist/manifest.webmanifest`
- `npm run test` kører 10 tests der alle består
- 3 PWA-ikoner genereret i `public/`
- Appen er installerbar via Chrome DevTools → Application

**Næste skridt:**
- Push-notifikationer (separat fase)
- Eventuelt offline-support med synkroniseringskø

---

## 2026-05-02 — Fase 7: UI-polish & Deploy

**Hvad:** Visuel finpudsning og forberedelse til præsentation — loading-spinnere, hover-states, fokusring, bekræftelses-dialoger, offline-indikator og Vercel-deploy.

**Beslutninger:**
- **CSS-only spinner** med Tailwind `animate-spin` — ingen ekstra bibliotek, minimal bundle-impact
- **`focus-visible`** i stedet for `:focus` — viser kun fokusring ved tastaturnavigation, ikke mus/touch
- **Hover-states** ét trin lysere end base, active ét trin mørkere — visuelt konsistent hierarki
- **48px kompasknapper** (h-12 w-12) — Apple anbefaler minimum 44pt touch target, vigtigt med handsker
- **`window.confirm()`** til bekræftelse — React-portaler spiller dårligt sammen med Leaflet Popups, så en custom modal er ikke praktisk
- **OfflineBanner** med `navigator.onLine` + events — simpelt og pålideligt, ingen polling
- **Ingen hamburger-menu** — 4-5 korte nav-links passer på 320px, hamburger gemmer navigation bag ekstra tryk
- **Ingen dark mode** — appen bruges udendørs i dagslys
- **Ingen toast-notifikationer** — kræver notification-system, over-engineering for nu
- **Ingen panel-animationer** — kræver mount/unmount-logik, minimal UX-gevinst

**Nye filer (2 stk):**
- `src/components/Spinner.tsx` — Genbrugelig loading-spinner med size-prop ("sm" til knapper, "default" standalone)
- `src/components/OfflineBanner.tsx` — Gul banner der vises øverst når internet mangler

**Ændrede filer (11 stk):**
- `src/index.css` — Global `focus-visible` regel (stone-600, 2px outline)
- `src/components/Layout.tsx` — Import og render `<OfflineBanner />` efter header
- `src/features/auth/ProtectedRoute.tsx` — Erstattet "Innlesur..." tekst med centreret Spinner
- `src/features/auth/LoginPage.tsx` — Spinner i submit-knap under loading
- `src/features/auth/RegisterPage.tsx` — Spinner i submit-knap under loading
- `src/features/groups/GroupsPage.tsx` — Spinner + tekst i loading-state
- `src/features/chat/ChatPage.tsx` — Spinner i send-knap under sending
- `src/features/map/MapActionButton.tsx` — Hover-states på alle 3 knapper
- `src/features/map/AddSightingPanel.tsx` — Hover-states + kompasknapper forstørret til 48px
- `src/features/map/AddOrderPanel.tsx` — Hover-states på Angra og Send
- `src/features/map/SheepSightingsLayer.tsx` — Hover-state + confirm på Liðugt
- `src/features/map/OrdersLayer.tsx` — Hover-states + confirm på Liðugt og Strika

**Verifikation:**
- `npm run build` bygger uden fejl (chunk-størrelses-advarsel for Leaflet er forventet)
- `npm run test` kører 10 tests der alle består
- Spinner vises ved loading states (ProtectedRoute, GroupsPage, Login, Register, Chat)
- Fokusring synlig ved Tab-navigation, skjult ved mus
- Alle knapper har hover-effekt
- Kompasknapper er 48px (h-12 w-12)
- `window.confirm()` vises ved Liðugt (sightings + orders) og Strika (orders)
- Offline-banner vises når internet slås fra

**Næste skridt:**
- Deploy til Vercel (kræver brugerens GitHub-repo tilslutning)
- Push-notifikationer (separat fase)
- Eventuelt offline-support med synkroniseringskø

---

## 2026-05-02 — Forenklet login og gruppe-tilmelding

**Hvad:** Reduceret onboarding fra 5 skridt (registrer → forsiden → bólkar → indtast kode → kort) til 2 skridt (skriv navn → vælg grupper). Bruger Supabase Anonymous Auth.

**Beslutninger:**
- **Supabase Anonymous Auth** (`signInAnonymously()`) — opretter en rigtig bruger med `auth.uid()` uden email/password. RLS virker stadig. Kræver at "Allow anonymous sign-ins" slås til i Supabase Dashboard
- **QuickStartPage** erstatter LoginPage og RegisterPage — ét navnefelt + "Byrja"-knap. Email-login beholdt som fold-ud sektion for bagudkompatibilitet
- **Toggle-join** på GroupsPage — viser ALLE grupper med checkmarks i stedet for 6-cifret kode-input. Klik = join/leave. "Kort →" knap vises når mindst én gruppe er valgt
- **Slettet JoinGroupForm** — erstattet af den nye toggle-liste direkte i GroupsPage
- **`/register` rute fjernet** — der er kun `/login` nu (QuickStartPage)
- **`signUp` bevaret** i AuthContext — bruges ikke aktivt men forbliver for fremtidig brug

**Ny fil (1 stk):**
- `src/features/auth/QuickStartPage.tsx` — Forenklet startside med navnefelt + email-login fold-ud

**Slettede filer (3 stk):**
- `src/features/auth/LoginPage.tsx` — erstattet af QuickStartPage
- `src/features/auth/RegisterPage.tsx` — erstattet af QuickStartPage
- `src/features/groups/JoinGroupForm.tsx` — erstattet af toggle-liste i GroupsPage

**Ændrede filer (4 stk):**
- `src/features/auth/AuthContext.tsx` — +`quickStart(displayName)` metode med anonym auth + profil-opdatering
- `src/features/groups/GroupsPage.tsx` — Omskrevet: henter alle grupper + memberships, toggle-checkmarks, "Kort →" knap
- `src/App.tsx` — `/login` → QuickStartPage, `/register` fjernet
- `src/App.test.tsx` — Opdateret tests til ny QuickStartPage-overskrift

**Kræver manuel handling i Supabase Dashboard:**
- Authentication → Settings → "Allow anonymous sign-ins" → slå TIL

**Verifikation:**
- `npm run build` bygger uden fejl
- `npm run test` kører 10 tests der alle består
- Nyt flow: Navn → Byrja → Vælg grupper → Kort (2 skridt)
- Eksisterende brugere kan stadig logge ind via email-sektionen
