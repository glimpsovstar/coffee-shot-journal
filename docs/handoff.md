# Coffee Shot Journal — handoff & resume guide

**Status:** **PARKED** — no active development (June 2026).  
**Production:** [https://coffeesnob.withdevo.net](https://coffeesnob.withdevo.net)  
**Repo:** [glimpsovstar/coffee-shot-journal](https://github.com/glimpsovstar/coffee-shot-journal) · `main` (protected; merge via PR)

Start here when you pick the project up again.

---

## Resume checklist (≈15 minutes)

1. `git checkout main && git pull origin main`
2. `npm install`
3. `npm run test:run` — expect **226** tests green ([test map](#test-map))
4. `npm run build`
5. Optional: `.env.example` → `.env.local` (Supabase, optional `VITE_GOOGLE_MAPS_API_KEY`)
6. `npm run dev` or test on prod with `/test-login`
7. Read [Next work](#next-work-prioritized) and open/close GitHub issues as needed

**Operator runbook:** [`docs/demo-flow.md`](demo-flow.md)  
**Architecture:** [`constitution.md`](constitution.md)

---

## Production snapshot (at park)

| Item | Detail |
|------|--------|
| **URL** | https://coffeesnob.withdevo.net |
| **Hosting** | Vercel (auto-deploy from `main`) |
| **Data** | Supabase Postgres + Storage + Auth |
| **Beta login** | `/test-login` → `test@withdevo.net` (journal cloned from operator account) |
| **Tests on `main`** | 226 (`npm run test:run`) |

**Clone test journal again** (operator): see `docs/demo-flow.md` § Clone journal to test user — needs `.env.clone.local` + `npm run clone-journal`.

---

## What shipped (session summary)

| Area | Status | PR / notes |
|------|--------|------------|
| Interaction layer (FAB, flavor dial, bento feed) | ✓ | #69–#73 |
| Hero **Log a shot** on extraction wave | ✓ | #74, #79 (bottom-centre + spacing) |
| Café → Google Maps Phase 1 (KML, deep links) | ✓ | #76 |
| Handoff doc + café map tests | ✓ | #77 |
| Vercel `tsc` build fix (journalCloneRemap) | ✓ | #78 |
| Journal clone script (global id remap) | ✓ | on `main` |
| In-app café map (Phase 2) | **Not started** | [`2026-06-14-cafe-google-maps-export-design.md`](superpowers/specs/2026-06-14-cafe-google-maps-export-design.md) |

---

## Open when parked (optional cleanup)

| Item | Notes |
|------|--------|
| [PR #60](https://github.com/glimpsovstar/coffee-shot-journal/pull/60) | OAuth error copy — stale branch; review or close before merge |
| [Issue #75](https://github.com/glimpsovstar/coffee-shot-journal/issues/75) | Café Google Maps — close if Phase 1 acceptance is done |

No known production blockers after #78 (build) and #79 (hero CTA).

---

## Next work (prioritized)

| Priority | Item | Where to start |
|----------|------|----------------|
| **P1** | In-app **My café map** (pins, stars, reviews) | Phase 2 in café-maps design spec → `writing-plans` |
| **P2** | KML export nudge when journal changed | `cafeMapKml.ts` + localStorage |
| **P3** | README backlog: filters, CSV export, edit beans | GitHub issues per SDLC |
| **P4** | iOS client | `vercel-supabase-single-user-design.md` |

**Parked permanently:** AWS / ECS / Vault — `constitution.md` § Parked.

---

## Test map

```bash
npm run test:run
```

| Feature / module | Test file(s) |
|------------------|--------------|
| Café KML export | `src/utils/cafeMapKml.test.ts` |
| Google Maps URLs | `src/lib/mapsConfig.test.ts` |
| Journal clone remap | `src/utils/journalCloneRemap.test.ts` |
| Add café visit form | `src/components/AddCafeForm.test.tsx` |
| Backup + KML button | `src/components/JournalBackupPanel.test.tsx` |
| Hero / journal shell | `src/components/JournalHero.test.tsx`, `src/App.test.tsx` |
| Journal / cloud | `src/hooks/useJournal.test.ts`, `src/utils/journalBackup.test.ts` |

**Fixtures:** `src/test/fixtures.ts` (`mockBeans`, `mockCafe`, `mockShot`).

---

## Key smoke flows

| Flow | Path |
|------|------|
| Log home shot | Journal → FAB or Log → Home shot |
| Extraction wave CTA | Journal hero → **Log a shot** below photo row |
| Log café visit | Log → Café → Places → Save → Open in Google Maps |
| Export café map | Backup & restore → Download café map (KML) |
| Test account | `/test-login` |

---

## Docs index

| Doc | Purpose |
|-----|---------|
| [`README.md`](../../README.md) | Features, quick start |
| [`constitution.md`](../../constitution.md) | Platform direction |
| [`demo-flow.md`](demo-flow.md) | Vercel, Supabase, OAuth, clone, KML |
| [`superpowers/specs/`](superpowers/specs/) | Approved designs |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | Issue → branch → PR |

---

## Environment (production)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_*` | Cloud journal |
| `OPENAI_API_KEY` | Label scan, dial-in API (server) |
| `VITE_GOOGLE_MAPS_API_KEY` | Places, map embed |

See `.env.example` and `.env.clone.local.example` for local operator scripts.

---

*Last updated when project was parked (June 2026). Bump this doc when you resume.*
