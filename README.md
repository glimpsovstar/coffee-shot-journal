# Coffee Shot Journal

A small React + TypeScript app for logging espresso beans and shots—built to practice dialing in consistency and taste over time.

## Why I built this

I pull espresso at home and wanted a lightweight way to remember what worked. Small changes in bean age, grind, dose, and yield all affect the cup, but it is easy to forget what you tried last week. This journal keeps beans and shots in one place so patterns (and mistakes) are easier to spot.

## What the app does today

- **Bean catalogue** — seed beans plus **add bean** (manual entry, bag/label photos)
- **Bean metadata** — purchase date, bag size, single origin vs blend with composition %
- **Label scan (demo)** — optional OpenAI vision prefill from a bag photo when `VITE_OPENAI_API_KEY` is set in `.env.local` (see [CONTRIBUTING.md](CONTRIBUTING.md); production should use a backend proxy — tracked as a high-priority security issue)
- **Shot history** — espresso pulls sorted newest first, with optional puck/cup photos
- **Add-shot form** — log a new pull with photos; it appears at the top of the list
- **IndexedDB persistence** — beans, shots, and image blobs survive refresh (on-device only)

There is no cloud backend yet—data is on-device only. Clearing browser site data removes your journal. The app is deployed at **[https://coffeesnob.withdevo.net](https://coffeesnob.withdevo.net)** (Vercel); cloud sync via **Supabase** (passkey auth) is the active roadmap. See platform docs below.

### Bean fields

| Field | Description |
|-------|-------------|
| Name | Coffee name |
| Roaster | Who roasted it |
| Kind | Single origin or blend |
| Origin / blend name | Region/country (single origin) or blend name on the bag — not roast level |
| Roast style | Light, medium, or dark |
| Blend breakdown | Named origins with % (must total 100 for blends) |
| Roast date | When the beans were roasted |
| Purchase date | When you bought the bag |
| Bag size | `200g`, `250g`, `500g`, or `1kg` |
| Tasting notes | Reference flavour notes |
| Photos | Up to 5 images (JPEG, PNG, WebP, HEIC; 5 MB each) |

### Shot fields

| Field | Description |
|-------|-------------|
| Bean | Which bean was used |
| Brewed | Date and time of the pull |
| Suburb | Optional AU/NZ suburb typeahead; **Update from photo** can suggest nearest suburb from GPS |
| Weather | Fetched on save when suburb is set (Open-Meteo, temperature, humidity, conditions) |
| Grinder & grind setting | Equipment and setting |
| Dose in / yield out | Input and output in grams |
| Extraction time | Pull time in seconds |
| Tasting notes | What you tasted (optional) |
| Rating | 1–5 stars |
| Photos | Up to 5 images attached when logging (read-only after save) |

## What I want to add later

- **Edit / retire beans** — update or archive catalogue entries (add is done)
- **Secure label scanning** — backend proxy so API keys are not in the browser (see GitHub issues labeled `security`)
- **Filters & search** — by bean, rating, or date range
- **Charts** — dose/yield/time trends over time
- **Export** — CSV or JSON for backup and analysis
- **Image compression** — smaller IndexedDB footprint for large photo libraries

**Platform roadmap** (Vercel + Supabase + future iOS): **`https://coffeesnob.withdevo.net`**, Supabase Postgres + Storage, passkey auth, `/api/label-scan` on Vercel. See [`constitution.md`](constitution.md) and [`docs/superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md`](docs/superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md). The earlier AWS/ECS/Vault plan is **parked** — [`docs/public-hosting-plan.md`](docs/public-hosting-plan.md).

## AI-assisted development workflow

This repo is meant to double as a **demo of building software with an AI coding assistant** (e.g. Cursor). A typical flow:

1. **Start from an empty folder** — describe the product in plain language (domain + constraints).
2. **Scaffold** — generate a Vite + React + TypeScript project and verify `npm run dev`.
3. **Model the domain** — define `Bean` and `Shot` types before UI work.
4. **Seed realistic data** — makes the UI reviewable without manual entry.
5. **Build UI in slices** — catalogue, list, form; wire state in `App.tsx` last.
6. **Document intent** — README sections like this one capture *why*, not only *how*.
7. **Keep a prompt log** — see [`.prompts-history.md`](.prompts-history.md) for the exact prompts and timing used in this repo (hidden filename, committed for replay).

### Example prompts you can try

- “Create a React + TypeScript espresso journal with a bean catalogue, shot list, and add-shot form. Seed data only, no backend.”
- “Add types for Bean and Shot with these fields: …”
- “Extract ShotCard and AddShotForm into separate components with accessible labels.”
- “Update the README with what the app does today and what to add in v2.”

Reviewing git diffs and the README after each step shows how AI assistance accelerates scaffolding while you stay in control of scope and quality.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

Optional label scan (demo only): copy [`.env.example`](.env.example) to `.env.local`, set `VITE_OPENAI_API_KEY`, restart the dev server. Never commit `.env.local`.

Contributing and SDLC (issues → branch → PR): see [CONTRIBUTING.md](CONTRIBUTING.md).

Production build:

```bash
npm run build
npm run preview
```

## Testing

The project uses [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/react).

```bash
npm run test        # watch mode
npm run test:run    # single run (CI)
npm run test:coverage
```

| Layer | What is covered |
|-------|-----------------|
| Unit | `src/utils/shots.ts`, `src/utils/photos.ts`, `src/utils/beans.ts`, `src/services/labelVision.ts` |
| Storage | `src/storage/journalRepository.ts` (IndexedDB via `fake-indexeddb` in tests) |
| Data | `src/data/seed.ts` — referential integrity and valid fields |
| Component | Forms, photo upload/gallery, cards, catalogue |
| Integration | `App.tsx` — load journal, add shots, IndexedDB round-trip |

New behavior changes should include tests (see `.cursor/rules/require-tests.mdc`). When scope is unclear, ask before implementing (see `.cursor/rules/ask-when-unclear.mdc`). Commit in small, reviewable slices (see `.cursor/rules/commit-often.mdc`).

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for tests
- Plain CSS (no component library)
- [idb](https://github.com/jakearchibald/idb) + IndexedDB for on-device persistence
