# Platform demo flow — Coffee Shot Journal

Operator runbook for the **active** Vercel + Supabase platform. See [`constitution.md`](../constitution.md), [`handoff.md`](handoff.md) (resume after a break), and the [Vercel + Supabase design spec](superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md).

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
P1 (done):  Vercel project → custom domain → deploy SPA
P2 (done):  /api/label-scan → prod build without VITE_OPENAI_API_KEY
P3 (done):  Supabase schema + Storage + OAuth + cloud CRUD + optional passkey
P4:         iOS (SwiftUI + Supabase)
P5:         Product backlog (filters, charts, export enhancements)
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

## P2 — Secure label scan (done)

**Goal:** No OpenAI key in the browser bundle in production.

1. `api/label-scan.ts` — Vercel serverless proxy to OpenAI (shipped).
2. Set **`OPENAI_API_KEY`** in Vercel **Production** (and Preview if desired). **Do not** set `VITE_OPENAI_API_KEY` on Vercel.
3. Redeploy; add a bean with label photo → **Scan label**.
4. Verify network tab: `POST /api/label-scan` only — no `api.openai.com` from the browser.
5. Optional local demo: `VITE_OPENAI_API_KEY` in `.env.local` only.

---

## P3 — Supabase + auth + cloud journal (done)

**Goal:** Cloud journal — same beans/shots/photos on phone, laptop, and any browser after sign-in.

### 3a — Create Supabase project

1. New project in Supabase dashboard (Free tier OK for personal use).
2. Note **Project URL**, **publishable key** (`sb_publishable_…`), and **secret key** (`sb_secret_…`) — use new key format, not legacy anon/service_role JWT keys.
3. Add to Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or equivalent); secret key server-side only if needed.
4. Run SQL migrations in order: `supabase/migrations/001_journal.sql` then **`002_cafes.sql`** (café catalogue). Storage bucket + **RLS**: `auth.uid() = user_id`.

### 3b — Auth: social login + passkeys

| Setting | Value |
|---------|--------|
| **Site URL** | `https://coffeesnob.withdevo.net` |
| **Redirect URLs** | `https://coffeesnob.withdevo.net` (add preview URLs if needed) |
| **Relying Party ID** | `withdevo.net` (bare domain — do not change after enrollment) |
| **Relying Party name** | e.g. `coffee snob.` |
| **Allowed origins** | `https://coffeesnob.withdevo.net` only (localhost is incompatible with RP ID `withdevo.net`) |

1. **Social providers** (Authentication → Providers): enable **Google**, **Apple**, and/or **GitHub**. You must paste **both Client ID and Client Secret** from each provider console — `missing OAuth secret` means the secret field is empty. Redirect URI is your Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Enable sign-ups** if you want friends (or “Create account”) via Google/Apple/GitHub on the landing page (or keep invite-only and create users in the dashboard).
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

### 3e — Local → cloud data

| Path | When |
|------|------|
| **Auto prompt** | Only if cloud is **empty** and this browser has **non-seed** IndexedDB data. Skip is remembered per user. |
| **Backup & restore** | Export JSON on one machine → **Import backup to cloud** while signed in on production. |
| **Not shown** | Cloud already has beans/shots (stale local IndexedDB is ignored). |

Validate **V-1** through **V-4** in the design spec (phone add → laptop sees data; RLS; label scan).

### 3f — Beta testers (temporary email/password page)

For invited testers while sign-ups stay disabled:

1. Supabase → **Authentication → Providers** → enable **Email** (password on; public sign-ups still **off**).
2. **Authentication → Users** → **Add user** with email + password (**Auto confirm**).
3. Clone your cloud journal into the test user (beans/shots/cafes + `journal-photos` storage) — see **Clone journal to test user** below.
4. Share **`https://coffeesnob.withdevo.net/test-login`** plus credentials (not linked from the public landing page).
5. Tester signs in → redirected to **`/`** → normal journal (same session, same domain).
6. Remove `/test-login` when beta ends ([#61](https://github.com/glimpsovstar/coffee-shot-journal/issues/61)).

**Auto-confirm:** when you **Add user** in the dashboard, enable **Auto Confirm User** (or confirm the user manually). Without that, email/password sign-in returns an error even with the right password.

#### Clone journal to test user (operator script)

From this repo, with Supabase **service role** / **secret** key (Dashboard → Project Settings → API — never commit):

```bash
vercel env pull .env.vercel.clone --environment=production --yes
cp .env.clone.local.example .env.clone.local
# Edit .env.clone.local — paste secret key (sb_secret_…) from Supabase Dashboard → API
npm run clone-journal -- --from-env .env.vercel.clone --target test@withdevo.net
rm -f .env.vercel.clone
```

`vercel env pull` leaves **sensitive** keys empty (`SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The script auto-loads `.env.clone.local` for the secret key.

Use `--from-env` (not `--env-file` — Node 25 treats `--env-file` as its own flag).

Or set env vars manually:

```bash
export SUPABASE_URL='https://<ref>.supabase.co'
export SUPABASE_SECRET_KEY='sb_secret_…'
npm run clone-journal -- --target test@withdevo.net
# optional: --source your-operator@gmail.com
# inspect:  npm run clone-journal -- --dry-run --from-env .env.vercel.clone
```

The script picks the user with the most journal rows as source (excluding the target), replaces the target’s cloud data with a copy, and duplicates `journal-photos` storage files. Bean, shot, and café **row ids are regenerated** (Postgres primary key is global per `id`, not per user).

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
| Google login `missing OAuth secret` | Supabase → Auth → Providers → Google → paste **Client secret** from Google Cloud (not just Client ID) |
| Passkey / QR fails | Relying Party ID = `withdevo.net`; origins include prod URL; hybrid transport not stripped |
| Label scan 401/500 | Vercel function logs; `OPENAI_API_KEY` set in Production |
| Data not syncing | Supabase RLS policies; signed-in `auth.uid()` matches row `user_id` |
| **Save visit** fails on Log → Café | Table Editor missing `cafes` → run `supabase/migrations/002_cafes.sql`; check Network tab for `rest/v1/cafes` errors |
| Import banner keeps appearing | Cloud already has data → should not show; hard refresh after deploy; use Skip once (stored per user in local/session storage) |
| Tab still shows Vercel favicon | Chrome caches favicons aggressively; site must serve `/favicon.ico` (not only SVG). Hard refresh or clear site data; redeploy without build cache if icon file changed on Vercel |
| Stranger sees journal | Should not — unauthenticated users see landing / sign-in only |
| `/test-login` or deep links 404 on Vercel | SPA rewrite — `vercel.json` must serve `index.html` for non-`/api` paths |

## Café map on Google Maps (KML)

**Goal:** See logged cafés with your stars and notes inside the Google Maps app via **Google My Maps**.

**Prerequisites:** `VITE_GOOGLE_MAPS_API_KEY` on Vercel (Places + Maps Embed API enabled; referrer includes your domain).

**Export:**

1. **Backup & restore** → **Download café map (KML)**, or after **Save visit** → **Download café map (KML)**.
2. Open [Google My Maps](https://www.google.com/maps/d/) → **Create new map** → **Import** → upload the `.kml` file.
3. On phone: Google Maps → **Layers** → enable your My Map layer.

**Refresh after new visits:** Export a new KML and replace the layer (delete the old imported layer in My Maps first to avoid duplicate pins).

**Per visit:** After saving, use **Open in Google Maps** to save the place or get directions (uses `googlePlaceId` when available).

## Five-minute demo script (Vercel + Supabase audience)

1. Open **`https://coffeesnob.withdevo.net`** on phone — journal loads.
2. (P3+) Passkey sign-in → add shot with photo.
3. Same URL on laptop — QR + phone passkey → same data visible.
4. (P2+) Label scan — network tab shows `/api/label-scan`, not OpenAI from browser.
5. Vercel dashboard — latest deployment, env vars present (values hidden).
6. (P3+) Supabase dashboard — Auth user, RLS-enabled tables, Storage bucket.
