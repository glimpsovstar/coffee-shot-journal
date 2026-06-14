# Coffee Shot Journal — handoff & resume guide

**Paused:** June 2026 (active development on other projects).  
**Production:** [https://coffeesnob.withdevo.net](https://coffeesnob.withdevo.net)  
**Repo:** `glimpsovstar/coffee-shot-journal` · default branch `main` (protected; merge via PR)

Use this doc when returning to the project after a break.

---

## Resume checklist (≈15 minutes)

1. `git checkout main && git pull origin main`
2. `npm install`
3. `npm run test:run` — expect **218+** tests green (see [Test map](#test-map) below)
4. `npm run build`
5. Optional local cloud: copy `.env.example` → `.env.local` (Supabase + optional `VITE_GOOGLE_MAPS_API_KEY`)
6. `npm run dev` → sign in or use `/test-login` on beta
7. Read [Next work](#next-work-prioritized) and pick an issue or spec

**Operator runbook:** [`docs/demo-flow.md`](docs/demo-flow.md)  
**Architecture:** [`constitution.md`](constitution.md)

---

## What shipped before pause

| Area | Status | Notes |
|------|--------|--------|
| Vercel + Supabase cloud journal | ✓ | OAuth, passkey optional, RLS |
| Label scan + dial-in API | ✓ | `/api/label-scan`, `/api/shot-recommendations` |
| Editorial UI + bento feed | ✓ | Hero wave, FAB dock, compact cards |
| Café visits (one-step form) | ✓ | Places autocomplete, photos, weather |
| Café → Google Maps (Phase 1) | ✓ | KML export, map preview, Open in Google Maps ([#76](https://github.com/glimpsovstar/coffee-shot-journal/pull/76)) |
| In-app café map (Phase 2) | **Not started** | Spec: [`2026-06-14-cafe-google-maps-export-design.md`](superpowers/specs/2026-06-14-cafe-google-maps-export-design.md) § Phase 2 |

Recent merged PR themes: interaction layer (#69), bento grid (#71–#73), hero CTA center (#74), café KML (#76).

---

## Next work (prioritized)

| Priority | Item | Where to start |
|----------|------|----------------|
| **P1** | In-app **My café map** page (pins, stars, reviews) | New spec slice or Phase 2 in café-maps design → `writing-plans` |
| **P2** | KML export nudge when journal changed since last export | `cafeMapKml.ts` + localStorage timestamp |
| **P3** | README “later” items: filters, CSV export, edit/retire beans | GitHub issues per `sdlc-for-features` |
| **P4** | iOS client (program P4) | [`vercel-supabase-single-user-design.md`](superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md) |

**Parked permanently (unless program pivots):** AWS / ECS / Vault path — see `constitution.md` § Parked.

---

## Test map

Run: `npm run test:run`

| Feature / module | Test file(s) |
|------------------|--------------|
| Café KML export | `src/utils/cafeMapKml.test.ts` |
| Google Maps URLs | `src/lib/mapsConfig.test.ts` |
| Add café visit form | `src/components/AddCafeForm.test.tsx` |
| Backup + KML button | `src/components/JournalBackupPanel.test.tsx` |
| Café catalogue shell | `src/components/CafeCatalogue.test.tsx` |
| Log café coffee | `src/components/LogCafeCoffeeForm.test.tsx` |
| Google Places service | `src/services/googlePlaces.test.ts` |
| Journal clone remap | `src/utils/journalCloneRemap.test.ts`, `src/utils/journalCloneRemap.ts` |
| Journal / cloud / backup | `src/hooks/useJournal.test.ts`, `src/utils/journalBackup.test.ts` |
| Shot feed / cards | `src/components/ShotCard.test.tsx`, `src/utils/shotFeedLayout.test.ts` |
| Hero / journal shell | `src/components/JournalHero.test.tsx`, `src/App.test.tsx` |

**Adding behavior:** extend the matching test file; follow `.cursor/rules/require-tests.mdc`.  
**Fixtures:** `src/test/fixtures.ts` (`mockBeans`, `mockCafe`, `mockShot`, …).

---

## Key product flows (manual smoke)

| Flow | Path |
|------|------|
| Log home shot | Journal → FAB / Log → Home shot |
| Log café visit | Log → Café → pick Places name → map preview → Save visit → Open in Google Maps |
| Export café map | Backup & restore → Download café map (KML) → import in Google My Maps |
| Cloud sync | Sign in on prod → add shot → second device same account |

---

## Docs index

| Doc | Purpose |
|-----|---------|
| [`README.md`](../../README.md) | User-facing features, quick start, testing |
| [`constitution.md`](../../constitution.md) | Platform direction, phases |
| [`demo-flow.md`](demo-flow.md) | Vercel, Supabase, OAuth, KML on Google Maps |
| [`superpowers/specs/`](superpowers/specs/) | Approved designs |
| [`superpowers/plans/`](superpowers/plans/) | Implementation plans |
| [`.prompts-history.md`](../../.prompts-history.md) | AI prompt log (demo workflow) |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | Issue → branch → PR |

---

## Environment (production)

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel | Cloud journal |
| `OPENAI_API_KEY` | Vercel (server) | Label scan, dial-in API |
| `VITE_GOOGLE_MAPS_API_KEY` | Vercel | Places autocomplete, map embed, KML-friendly coords |

See `.env.example` for local names.

---

*Update the “What shipped” table and “Paused” date when you resume or ship again.*
