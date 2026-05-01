# Fjall — Seyðadriv Coordinator

PWA til koordinering af færøsk fåredrivning (seyðadriv).

## Tech stack

- **React 19** + **TypeScript** — UI-framework
- **Vite** — build-værktøj og udviklingsserver
- **Tailwind CSS v4** — utility-first styling
- **React Router v7** — klient-side navigation
- **Vitest** — test-framework
- **Supabase** — backend (auth, database, realtime) — tilføjes i Fase 2

## Kom i gang

```bash
npm install
npm run dev
```

## Scripts

| Kommando         | Beskrivelse                        |
|------------------|------------------------------------|
| `npm run dev`    | Start udviklingsserver             |
| `npm run build`  | Byg til produktion                 |
| `npm run test`   | Kør tests                          |
| `npm run lint`   | Kør ESLint                         |

## Projektstruktur

```
src/
├── components/    # Genbrugelige UI-komponenter
├── features/      # Funktionsområder (auth, drive, map, orders)
├── hooks/         # Custom React hooks
├── lib/           # Hjælpefunktioner og konfiguration
├── types/         # TypeScript-typedefinitioner
└── test/          # Test-setup
```

Se `ENGINEERING_LOG.md` for beslutninger og `TIME_LOG.md` for tidsforbrug.
