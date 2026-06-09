# Supabase setup (P3)

## 1. Run migration

In Supabase Dashboard → **SQL Editor**, paste and run:

`migrations/001_journal.sql`

This creates `beans`, `shots`, RLS policies, and the `journal-photos` storage bucket.

## 2. Environment variables

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` |

Use the **publishable** key (`sb_publishable_…`), not the secret key.

## 3. Auth

See `docs/demo-flow.md` § P3:

- **OAuth** — enable Google (and optional Apple/GitHub) in Authentication → Providers.
- **Passkeys** — RP ID `withdevo.net`, origin `https://coffeesnob.withdevo.net`.
- **Site URL** — `https://coffeesnob.withdevo.net`.

First sign-in: **Continue with Google** on the landing page. Optional passkey: **Backup & restore** → **Sign-in options**.

## 4. Local → cloud data

- Auto **Import journal from this device** only when cloud is empty and this browser has custom IndexedDB data.
- Otherwise: **Backup & restore** → export on dev machine → **Import backup to cloud** on production while signed in.
