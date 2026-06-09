# Platform demo flow — Coffee Shot Journal

Operator runbook for the **active** Vercel + Supabase platform. See [`constitution.md`](../constitution.md) and the [Vercel + Supabase design spec](superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md).

> **Parked:** The earlier AWS + Vault runbook (TFC, ECS, `dmtfc`, `coffee.dev.withdevo.net`) is preserved in git history and in [`public-hosting-plan.md`](public-hosting-plan.md). Do not follow it for new work.

## Before you start

| Platform | Access |
|----------|--------|
| **Vercel** | Project linked to `coffee-shot-journal` repo; Hobby tier |
| **Domain** | **`https://coffeesnob.withdevo.net`** — DNS at registrar → Vercel |
| **Supabase** | Project for P3+ (Postgres, Storage, Auth) — create when starting P3 |
| **Secrets** | `OPENAI_API_KEY` in Vercel Production env only (P2+); Supabase keys in Vercel + Vite publishable key |

## High-level flow

```
P1 (done):  Vercel project → custom domain → deploy SPA (IndexedDB OK)
P2:         /api/label-scan → prod build without VITE_OPENAI_API_KEY
P3:         Supabase schema + Storage + Passkey → migrate web to cloud CRUD
P4:         iOS (SwiftUI + Supabase)
P5:         Product backlog (#13–#16, export, charts, filters)
```

---

## P1 — Vercel deploy (done)

**Goal:** Public HTTPS SPA at `coffeesnob.withdevo.net`.

1. Link GitHub repo to a Vercel project (framework: Vite).
2. Add custom domain `coffeesnob.withdevo.net` in Vercel; point DNS (CNAME or A) per Vercel instructions.
3. Push to `main` (or merge PR) — Vercel builds and deploys.
4. Verify: `https://coffeesnob.withdevo.net` loads; journal works with on-device IndexedDB.

**Local dev:** `npm install` → `npm run dev` → `http://localhost:5173`.

---

## P2 — Secure label scan

**Goal:** Close GitHub **#1** — no OpenAI key in the browser bundle in production.

1. `api/label-scan.ts` — Vercel serverless proxy to OpenAI (shipped).
2. Set **`OPENAI_API_KEY`** in Vercel **Production** (and Preview if desired). **Do not** set `VITE_OPENAI_API_KEY` on Vercel.
3. Redeploy; add a bean with label photo → **Scan label**.
4. Verify network tab: `POST /api/label-scan` only — no `api.openai.com` from the browser.
5. Optional local demo: `VITE_OPENAI_API_KEY` in `.env.local` only.

---

## P3 — Supabase + Passkey (one-time operator setup)

**Goal:** Cloud journal — same beans/shots/photos on phone, laptop, and any browser after passkey sign-in.

### 3a — Create Supabase project

1. New project in Supabase dashboard (Free tier OK for personal use).
2. Note **Project URL**, **publishable key** (`sb_publishable_…`), and **secret key** (`sb_secret_…`) — use new key format, not legacy anon/service_role JWT keys.
3. Add to Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or equivalent); secret key server-side only if needed.
4. Define schema (beans, shots), Storage bucket for photos, **RLS** policies: `auth.uid() = user_id`.

### 3b — Auth: social login + passkeys

| Setting | Value |
|---------|--------|
| **Site URL** | `https://coffeesnob.withdevo.net` |
| **Redirect URLs** | `https://coffeesnob.withdevo.net` (add preview URLs if needed) |
| **Relying Party ID** | `withdevo.net` (bare domain — do not change after enrollment) |
| **Relying Party name** | e.g. `coffee snob.` |
| **Allowed origins** | `https://coffeesnob.withdevo.net` only (localhost is incompatible with RP ID `withdevo.net`) |

1. **Social providers** (Authentication → Providers): enable **Google**, **Apple**, and/or **GitHub**; paste OAuth client IDs/secrets from each provider console. Redirect URI is your Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Enable sign-ups** if you want “Create account” via Google/Apple/GitHub on the landing page (or keep invite-only and create users in the dashboard).
3. Enable **Passkeys** in Supabase Auth settings.
4. **First visit:** landing page → **Continue with Google** (or Apple/GitHub) → journal opens.
5. **Add passkey (optional):** while signed in, open **Backup & restore** → **Sign-in options** → **Add passkey**.
6. **Return visits:** **Sign in with passkey** or the same social button.

**Break-glass:** magic link from Authentication → Users still works if OAuth or passkeys fail.

### 3c — Laptop / borrowed PC sign-in

1. On laptop: sign in with passkey → browser offers **“Use a phone or tablet”** / QR (WebAuthn hybrid).
2. Scan QR with phone → approve with Face ID / Touch ID.
3. Laptop receives session — same cloud journal.
4. On borrowed machines: **sign out** when finished.

**Client note:** Enable experimental passkey in Supabase client (`auth.experimental.passkey: true`). Do not filter out `hybrid` transport — that breaks QR cross-device login.

### 3d — Break-glass (lockout recovery)

No magic link, password, or recovery codes in the app.

| Situation | Action |
|-----------|--------|
| Lost phone passkey | Supabase Dashboard → **Authentication → Users** → manage passkeys for your user |
| Re-register | Delete old passkey in dashboard; register new passkey on replacement device |

### 3e — Migrate web app

1. Ship client changes: Supabase SDK, passkey sign-in UI, CRUD against Postgres + Storage.
2. Optional one-time **IndexedDB → cloud** import for existing local data.
3. Validate **V-1** through **V-4** in the design spec (phone add → laptop sees data; RLS; label scan).

---

## P4 — iOS (later)

1. SwiftUI app + Supabase Swift SDK.
2. Same Supabase project; passkey / synced keychain.
3. Local cache; server authoritative.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Domain not resolving | DNS propagation; Vercel domain config |
| Passkey / QR fails | Relying Party ID = `withdevo.net`; origins include prod URL; hybrid transport not stripped |
| Label scan 401/500 | Vercel function logs; `OPENAI_API_KEY` set in Production |
| Data not syncing | Supabase RLS policies; signed-in `auth.uid()` matches row `user_id` |
| Stranger sees journal | Should not — unauthenticated users see login only |

## Five-minute demo script (Vercel + Supabase audience)

1. Open **`https://coffeesnob.withdevo.net`** on phone — journal loads.
2. (P3+) Passkey sign-in → add shot with photo.
3. Same URL on laptop — QR + phone passkey → same data visible.
4. (P2+) Label scan — network tab shows `/api/label-scan`, not OpenAI from browser.
5. Vercel dashboard — latest deployment, env vars present (values hidden).
6. (P3+) Supabase dashboard — Auth user, RLS-enabled tables, Storage bucket.
