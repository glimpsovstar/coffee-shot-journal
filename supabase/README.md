# Supabase setup (P3)

## 1. Run migration

In Supabase Dashboard → **SQL Editor**, paste and run:

`migrations/001_journal.sql`

This creates `beans`, `shots`, RLS policies, and the `journal-photos` storage bucket.

## 2. Environment variables

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | Vercel + `.env.local` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` |

Use the **publishable** key (`sb_publishable_…`), not the secret key.

## 3. Passkeys

See `docs/demo-flow.md` — RP ID `withdevo.net`, origin `https://coffeesnob.withdevo.net`.

## 4. First sign-in

1. Create your user in Authentication → Users.
2. Register a passkey on your phone at `https://coffeesnob.withdevo.net`.
3. Use **Import to cloud** to upload local IndexedDB data once.
