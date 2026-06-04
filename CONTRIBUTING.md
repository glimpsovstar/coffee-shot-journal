# Contributing

## SDLC workflow (this repo)

1. **Open an issue** — use the Feature request template; list acceptance criteria and test plan.
2. **Branch** — `git checkout -b feature/<issue#>-short-description` from `main`.
3. **Implement** — small commits; include tests for behaviour changes (see `.cursor/rules/require-tests.mdc`).
4. **Verify** — `npm run test:run` and `npm run build`.
5. **Pull request** — link the issue (`Fixes #N`); fill in the PR template.
6. **Review** — self-review or peer review; address feedback.
7. **Merge** — squash merge to `main`; close the issue.

## Label scan (local demo only)

Optional OpenAI vision assist for bag labels requires a key in `.env.local`:

```bash
cp .env.example .env.local
# Set VITE_OPENAI_API_KEY=sk-...
npm run dev
```

**Do not commit API keys.** Production-style security (backend proxy) is tracked separately—see open issues with the `security` label.

## Cursor rules

Project rules live in `.cursor/rules/` (tests required, ask when unclear, commit often).
