# Contributing

## SDLC workflow (this repo)

For **new features**, **bugs**, and **non-trivial fixes** going forward:

1. **Open an issue** — Feature request or **Bug report** template; list acceptance criteria and test plan. **File the issue when you find the problem** (before or alongside the fix), including production-only operator issues (OAuth config, env vars).
2. **Branch** — `git checkout -b feature/<issue#>-short-description` from `main`.
3. **Implement** — small commits on the feature branch.
4. **Tests** — add or update tests for behavior under `src/` (see `.cursor/rules/require-tests.mdc`).
5. **Docs** — update README, `docs/demo-flow.md`, or specs when users or operators would notice (see `.cursor/rules/require-docs.mdc`).
6. **Verify** — `npm run test:run` and `npm run build`.
7. **Pull request** — link the issue (`Fixes #N`); fill in the PR template.
8. **Merge** — squash merge to `main`; Vercel deploys `https://coffeesnob.withdevo.net`; close the issue.

**Historical note:** P1–P3 platform work and several post-launch fixes landed on `main` without issues. Retroactive bug issues **#23–#30** document those fixes. Use the issue → branch → PR path for **future** work.

Obvious typos, clear one-line bugs, or explicit "just fix it" requests may skip the issue when the user says so.

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

Project rules live in `.cursor/rules/` (SDLC, tests, docs, ask when unclear, commit policy).
