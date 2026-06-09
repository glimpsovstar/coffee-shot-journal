# Coffee Shot Journal — Vercel + Supabase (single-user) design spec

**Status:** Approved direction (AWS/Vault path **parked**). **Implementation:** P1–P3 shipped on `main` (Vercel + Supabase + `/api/label-scan` + OAuth landing).  
**Supersedes for implementation:** `2026-06-05-p1-platform-foundation-design.md` (AWS/ECS).  
**Program context:** [Program design](2026-06-05-coffee-shot-journal-program-design.md) — phases redefined below.

### Implementation notes (2026-06)

| Area | Shipped behavior |
|------|------------------|
| Auth | Google/Apple/GitHub OAuth on landing; optional passkey in **Backup & restore → Sign-in options** |
| Cloud import | Banner only when cloud empty + local has custom IndexedDB data; skip persisted per user |
| Label scan | `api/label-scan.ts` + `OPENAI_API_KEY` on Vercel |
| Branding | `public/branding/`, `public/favicon.svg`, coffee snob. landing page |

---

## Summary

Personal espresso journal as a **public HTTPS web app** at **`https://coffeesnob.withdevo.net`**, reachable from **phone, your laptop, or any other browser** after **you** sign in. Data and photos live in **Supabase** (cloud), not per-device IndexedDB. **Passkey** (WebAuthn) is the primary login method. Label scan uses a **Vercel Serverless Function** so **OpenAI keys never ship to the browser** (closes GitHub **#1**).

**Parked:** multi-user product (no public sign-up, no sharing features), AWS/ECS/Vault/TFC for this app, HashiCorp demo narrative.

---

## Problem

- Journal must work **from anywhere** on the **same URL** with **shared history** and **photo uploads**.
- Label scan today requires a **browser-exposed OpenAI key** — unsafe for public deploy.
- AWS + Vault path is **too costly and complex** for a non-commercial personal app.

---

## Desired outcomes

| Outcome | How |
|---------|-----|
| Same URL everywhere | `coffeesnob.withdevo.net` on Vercel |
| Phone + laptop + borrowed PC | Cloud data in Supabase; sign in on each device |
| Secure label scan | `/api/label-scan` on Vercel; `OPENAI_API_KEY` server-only |
| Low infra cost | Vercel Hobby + Supabase Free where possible |
| Easy login on phone | **Passkey** (Face ID / Touch ID / device PIN) |

---

## Architecture

```text
                    https://coffeesnob.withdevo.net
                              │
                    Vercel (React SPA)
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   Supabase Auth          Supabase API         /api/label-scan
   (Passkey/WebAuthn)    Postgres + Storage    Vercel Function
         │                    │                    │
         └────────────────────┴────────── OPENAI_API_KEY (Vercel env only)
```

| Layer | Technology |
|-------|------------|
| **Hosting** | Vercel Hobby (personal, non-commercial) |
| **Domain** | `coffeesnob.withdevo.net` — DNS at WordPress/registrar → Vercel |
| **Auth** | Supabase Auth — **Passkey (WebAuthn)** primary; sign-up **disabled** for public (single-user: operator provisions account) |
| **Data** | Supabase Postgres — beans, shots, metadata |
| **Photos** | Supabase Storage — bucket with RLS |
| **Label scan** | Vercel Serverless Function — not Supabase Edge (unless moved later) |
| **Client** | Existing React app; migrate from IndexedDB-as-truth to Supabase |

---

## Auth (Passkey only + phone QR on laptop)

| Topic | Decision |
|-------|----------|
| **Primary method** | Passkey via Supabase Auth WebAuthn — **no** magic link, password, or recovery codes |
| **Phone** | Register passkey on phone first (Face ID / Touch ID) |
| **Laptop / borrowed PC** | **Cross-device (hybrid) sign-in** — browser shows **QR code**; scan with phone to approve login |
| **Multi-user** | **Parked** — disable public registration; operator account only |
| **Session** | Supabase JWT; refresh via client SDK |
| **iOS later** | Same Supabase project; native passkey / synced keychain |

**How QR login works (you don’t build custom QR logic):**

1. On laptop: `signInWithPasskey()` → no local passkey → browser/OS offers **“Use a phone or tablet”** / QR flow (WebAuthn **hybrid** transport).
2. Scan QR with phone → approve with Face ID / Touch ID on the passkey registered for this site.
3. Laptop receives authenticated session — same cloud journal.

**Supabase dashboard (Authentication → Passkeys):**

| Setting | Value |
|---------|--------|
| **Relying Party ID** | `withdevo.net` (bare domain — stable; do not change after users enroll) |
| **Relying Party name** | e.g. `Coffee Snob Journal` |
| **Allowed origins** | `https://coffeesnob.withdevo.net` (+ `http://localhost:5173` for dev) |

**Client:** enable experimental passkey in `createClient` (`auth.experimental.passkey: true`). Do **not** filter out `hybrid` transport in WebAuthn options — that breaks QR cross-device login.

**Operator setup (one-time):** Create Supabase project → enable Passkeys → register passkey on **phone** → disable open sign-up → test laptop QR flow before P3 data migration.

**Borrowed laptop:** Sign in via phone QR → use app → **sign out** when finished (clear session on that browser).

**Backup & lockout (decided — option C):**

| Layer | Approach |
|-------|----------|
| **Normal** | Passkey on **phone** (primary); optional **second passkey on your laptop** registered up front |
| **Laptop daily use** | Phone QR hybrid sign-in, or laptop passkey if registered |
| **Break glass** | **Not in the app** — operator uses **Supabase Dashboard** (Auth → Users → passkeys) to delete/re-register passkeys if phone is lost; document in `docs/demo-flow.md` |

No magic link, password, or recovery codes in the product UI.

---

## Secrets

| Secret | Where | Client exposure |
|--------|--------|-----------------|
| `OPENAI_API_KEY` | Vercel env (Production) | **Never** |
| Supabase **publishable** key | Vite `VITE_*` / publishable key | Yes — **RLS** enforces owner-only rows |
| Supabase **secret** key | Vercel env only (if needed) | **Never** |
| Passkeys | Device secure enclave / platform | Not stored in app code |

**Rotation:** OpenAI → Vercel env + redeploy. Supabase secret keys → create new key in dashboard, update Vercel, revoke old. Publishable key → rotate + redeploy SPA. User passkeys → add/remove in Supabase Auth / device settings.

Use **new** Supabase publishable/secret API keys (`sb_publishable_…` / `sb_secret_…`), not legacy long-lived anon/service_role JWT keys, when creating the project.

---

## Security (single-user)

- **RLS** on all tables and Storage policies: `auth.uid() = user_id` (or single fixed owner id).
- **No public read** — unauthenticated visitors see login only.
- Rate limit `/api/label-scan` (IP and/or require valid Supabase session).
- Sign out on borrowed laptops after use (UX prompt optional).

---

## Phased delivery

| Phase | Deliverable |
|-------|-------------|
| **P1** | Vercel project; `coffeesnob.withdevo.net`; deploy current SPA (IndexedDB OK temporarily) |
| **P2** | `/api/label-scan`; prod build without `VITE_OPENAI_API_KEY`; close **#1** |
| **P3** | Supabase schema + Storage + Passkey auth + migrate web to cloud CRUD; optional one-time IndexedDB import |
| **P4** | iOS (SwiftUI + Supabase Swift SDK + passkey) |
| **P5** | Export, charts, filters, edit beans, backlog issues |

**Parked:** `tf-coffee-journal-*`, Vault namespace, `api.coffee.dev.withdevo.net`.

---

## Success criteria

1. `https://coffeesnob.withdevo.net` loads on phone and desktop.
2. After passkey sign-in, same beans/shots/photos on any device.
3. Label scan in prod: network tab shows only same-origin `/api/…`, not OpenAI from browser.
4. No `sk-` or `VITE_OPENAI` in production client bundle.
5. Stranger opening URL cannot read journal without your passkey.

---

## Validation

| ID | Check |
|----|--------|
| V-1 | Phone: passkey login → add shot with photo → laptop: same data after login |
| V-2 | Borrowed browser: QR + phone passkey → data visible; sign out clears session |
| V-3 | `curl` label-scan route without abuse; OpenAI key not in `dist/` assets |
| V-4 | RLS: anon key cannot read other `user_id` rows (test with second test user disabled in prod) |

---

## Open items (for implementation plan)

| ID | Topic | Status |
|----|--------|--------|
| F1 | Passkey fallback | **Decided:** passkey only; laptop via QR + phone; backup laptop passkey + dashboard break-glass (option C) |
| F2 | PWA install prompt for phone home-screen | Open (optional P1/P3) |
| F3 | Supabase free tier pause after 1 week idle | Open — acceptable or Pro later |
| F4 | Photo volume vs 1 GB Storage free limit | Open |

---

## Related / parked docs

| Doc | Status |
|-----|--------|
| `2026-06-05-p1-platform-foundation-design.md` | **Parked** (AWS) |
| `constitution.md` | Update when implementation starts — note Vercel path |
| `docs/demo-flow.md` | Rewrite for Vercel + Supabase operator flow |
