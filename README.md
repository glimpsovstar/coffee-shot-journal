# Coffee Shot Journal

A small React + TypeScript app for logging espresso beans and shots—built to practice dialing in consistency and taste over time.

## Why I built this

I pull espresso at home and wanted a lightweight way to remember what worked. Small changes in bean age, grind, dose, and yield all affect the cup, but it is easy to forget what you tried last week. This journal keeps beans and shots in one place so patterns (and mistakes) are easier to spot.

## What the app does today

- **Bean catalogue** — read-only reference list from seed data
- **Shot history** — espresso pulls sorted newest first
- **Add-shot form** — log a new pull; it appears at the top of the list

All data lives in the browser (seed data + React state). There is no backend, auth, or persistence yet.

### Bean fields

| Field | Description |
|-------|-------------|
| Name | Coffee name |
| Roaster | Who roasted it |
| Origin / blend | Single origin or blend description |
| Roast date | When the beans were roasted |
| Tasting notes | Reference flavour notes |

### Shot fields

| Field | Description |
|-------|-------------|
| Bean | Which bean was used |
| Brewed | Date and time of the pull |
| Grinder & grind setting | Equipment and setting |
| Dose in / yield out | Input and output in grams |
| Extraction time | Pull time in seconds |
| Tasting notes | What you tasted (optional) |
| Rating | 1–5 stars |

## What I want to add later

- **Persistence** — `localStorage` or a simple database so data survives refresh
- **Bean CRUD** — add, edit, and retire beans in the UI
- **Filters & search** — by bean, rating, or date range
- **Charts** — dose/yield/time trends over time
- **Photos** — puck and cup shots for visual reference
- **Export** — CSV or JSON for backup and analysis

Explicitly **not** planned for v1: authentication, image upload pipelines, weather APIs, or AI recommendations.

## AI-assisted development workflow

This repo is meant to double as a **demo of building software with an AI coding assistant** (e.g. Cursor). A typical flow:

1. **Start from an empty folder** — describe the product in plain language (domain + constraints).
2. **Scaffold** — generate a Vite + React + TypeScript project and verify `npm run dev`.
3. **Model the domain** — define `Bean` and `Shot` types before UI work.
4. **Seed realistic data** — makes the UI reviewable without manual entry.
5. **Build UI in slices** — catalogue, list, form; wire state in `App.tsx` last.
6. **Document intent** — README sections like this one capture *why*, not only *how*.

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

Production build:

```bash
npm run build
npm run preview
```

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- Plain CSS (no component library)
- Local React state only
