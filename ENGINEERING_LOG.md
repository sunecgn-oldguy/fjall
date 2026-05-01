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
