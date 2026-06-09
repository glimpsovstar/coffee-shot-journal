# Contributing

## Workflow (this repo)

We ship directly to `main` on Vercel. **GitHub issues and feature branches are optional** — not required for every change.

For **new features** and **non-trivial fixes**:

1. **Implement** — small commits on `main` (or a branch if you prefer).
2. **Tests** — add or update tests for behavior under `src/` (see `.cursor/rules/require-tests.mdc`).
3. **Docs** — update README, `docs/demo-flow.md`, or specs when users or operators would notice (see `.cursor/rules/require-docs.mdc`).
4. **Verify** — `npm run test:run` and `npm run build` before you consider the work done.
5. **Deploy** — push to `main`; Vercel deploys `https://coffeesnob.withdevo.net`.

Optional: open a GitHub issue or PR for tracking or review — use when you want discussion, not as a gate.

## Label scan

**Production:** `OPENAI_API_KEY` on Vercel only; client calls `/api/label-scan`.

**Local demo:** optional key in `.env.local`:

```bash
cp .env.example .env.local
# Set VITE_OPENAI_API_KEY=sk-...
npm run dev
```

**Do not commit API keys.**

## Auth (production)

- Landing page: Google / Apple / GitHub OAuth (configure providers in Supabase).
- Optional passkey: **Backup & restore** → **Sign-in options** after first social sign-in.
- Operator runbook: [`docs/demo-flow.md`](docs/demo-flow.md).

## Cursor rules

Project rules live in `.cursor/rules/` (tests, docs, ask when unclear, commit policy).
