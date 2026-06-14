# Constitution — Coffee Shot Journal platform

## Active direction (2026)

**Implementation path:** **Vercel** (hosting + serverless API) + **Supabase** (Postgres, Storage, Passkey auth).  
**Public URL:** **`https://coffeesnob.withdevo.net`** — live on Vercel with cloud journal (Supabase).  
**Approved spec:** [`docs/superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md`](docs/superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md).

**Parked:** AWS/ECS/Vault/TFC path (`coffee.dev.withdevo.net`, `tf-coffee-journal-*`, HCP Vault namespace `coffee-shot-journal`). Historical detail remains below and in [`docs/public-hosting-plan.md`](docs/public-hosting-plan.md) and [`docs/superpowers/specs/2026-06-05-p1-platform-foundation-design.md`](docs/superpowers/specs/2026-06-05-p1-platform-foundation-design.md).

---

## Purpose

Single source of truth for the **Coffee Shot Journal** as a **long-lived platform**: public web app now, **shared cloud data** for phone and laptop, and a future **Apple (iOS) app** on the same backend.

**Active stack:** Vercel + Supabase — personal, low-cost; Google/OAuth sign-in + optional passkey.

**Parked stack:** AWS + HCP Terraform + HCP Vault + ECS — preserved for reference; not pursued for this app.

Read this before platform work, Supabase schema/auth, or mobile clients.

## Core intent

- **API-first (Vercel path):** web and iOS are clients; **Supabase** is the system of record when signed in.
- **Secure label scan:** `/api/label-scan` on Vercel; **no OpenAI keys** in production browser bundles.
- **Auth:** Supabase — **Google/OAuth** on landing page; optional **passkey** (Backup & restore → Sign-in options); laptop QR hybrid when using passkey without a local credential.
- **Single-user RLS:** `auth.uid() = user_id` on Postgres and Storage; unauthenticated visitors see login only.
- **Never** commit secrets, tokens, or credential material.

### Vercel + Supabase architecture (active)

| Layer | Technology |
|-------|------------|
| **Hosting** | Vercel Hobby — React SPA + Serverless Functions |
| **Domain** | `coffeesnob.withdevo.net` |
| **Auth** | Supabase Auth — OAuth (Google, etc.) + optional Passkey (WebAuthn) |
| **Data** | Supabase Postgres — beans, shots |
| **Photos** | Supabase Storage — RLS per owner |
| **Label scan** | Vercel Function — `OPENAI_API_KEY` server-only |
| **Client** | This repo — cloud CRUD when signed in; IndexedDB for local-only dev and backup export |

**Phases:** P1 Vercel deploy ✓ · P2 `/api/label-scan` ✓ · P3 Supabase + cloud CRUD + auth ✓ · P4 iOS · P5 product backlog.

**Development paused (June 2026):** production remains live; no active feature work. Resume guide: [`docs/handoff.md`](docs/handoff.md).

**Branding:** `public/branding/` — coffee snob. logo assets; favicon at `public/favicon.svg`.

**Operator runbook:** [`docs/demo-flow.md`](docs/demo-flow.md).

---

## Parked — AWS / Vault / TFC (historical)

The sections below document the **parked** AWS path. Do not provision new infra from this unless the program pivots back.

### Original purpose (parked)

Long-lived platform on **AWS** with **HCP Terraform**, **HCP Vault**, and optional **AAP** for operations. Independent TFC workspaces, Vault namespace, ECS service.

### Repos (parked program)

| Repo | Role |
|------|------|
| `coffee-shot-journal` | React web UI, tests, product docs |
| **`glimpsovstar/tf-coffee-journal-infra`** (not created) | TFC **`tf-coffee-journal-infra`**: ECS, ALB, RDS, S3, CloudFront, Cognito, ECR, IAM |
| **`glimpsovstar/tf-coffee-journal-vault`** (not created) | TFC **`tf-coffee-journal-vault`**: namespace, KV, policies, AWS auth |
| `journal-api` (not created) | Container image for ECS: `/v1/*` REST API |

### Architecture summary (parked)

See [`docs/public-hosting-plan.md`](docs/public-hosting-plan.md) — **superseded**; diagrams kept for reference.

| Layer | Technology |
|-------|------------|
| Web UI | S3 + CloudFront (Vite build) |
| API | ECS Fargate behind ALB |
| Data | RDS PostgreSQL |
| Photos | S3 presigned URLs |
| Users | Amazon Cognito + JWT |
| Secrets | HCP Vault namespace `coffee-shot-journal`, KV v2, AWS auth |

### HCP Vault (parked)

| Item | Value |
|------|--------|
| **Cluster** | `djoo-test-vault-public-vault-a40e8748.a3bc1cae.z1.hashicorp.cloud:8200` |
| **Admin namespace** | `admin` |
| **App namespace** | `coffee-shot-journal` |
| **Terraform workspace** | **`tf-coffee-journal-vault`** |

### HCP Terraform (parked)

| Workspace | Scope |
|-----------|--------|
| **`tf-coffee-journal-vault`** | Vault namespace, mounts, policies, AWS auth |
| **`tf-coffee-journal-infra`** | ECS, ALB, RDS, S3, CloudFront, Cognito, Route53, ECR |

- **Organization:** `djoo-hashicorp`
- **DNS (parked):** UI `coffee.dev.withdevo.net`, API `api.coffee.dev.withdevo.net`

### Operator access (parked AWS path)

| Platform | Access |
|----------|--------|
| **AWS** | `dmtfc tf-coffee-journal-infra` / `dmtfc tf-coffee-journal-vault` → `ap-southeast-2` |
| **HCP Terraform** | Org `djoo-hashicorp`; workspaces `tf-coffee-journal-*` |
| **HCP Vault** | TPM login → admin; child NS `coffee-shot-journal` |

### Milestones (parked — GitHub)

| Milestone | Scope |
|-----------|--------|
| **M1 — Platform foundation** | Vault + ECS skeleton — **superseded** by Vercel P1 |
| **M2 — Secure label scan** | `POST /v1/label-scan` on ECS — **replaced** by Vercel `/api/label-scan` |
| **M3 — Cloud journal** | Cognito, RDS, S3 — **replaced** by Supabase P3 |
| **M4 — iOS app** | SwiftUI + same API |
| **M5 — Product** | #13–#16, export, charts, filters |

## Working assumptions

- **Active:** Operator has Vercel project linked to this repo and a Supabase project for P3+.
- **iOS** is a **native client of the same Supabase backend**, not a forked data model.
- Open-Meteo / client geocoding may remain keyless until moved behind API.

## Related docs

| Doc | Status |
|-----|--------|
| [`docs/superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md`](docs/superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md) | **Active** |
| [`docs/handoff.md`](docs/handoff.md) | **Active** — resume checklist, test map, next work |
| [`docs/demo-flow.md`](docs/demo-flow.md) | **Active** — Vercel + Supabase operator flow |
| [`docs/public-hosting-plan.md`](docs/public-hosting-plan.md) | **Superseded** — AWS plan (parked) |
| [`docs/superpowers/specs/2026-06-05-p1-platform-foundation-design.md`](docs/superpowers/specs/2026-06-05-p1-platform-foundation-design.md) | **Parked** — AWS P1 spec |

## AI / SDLC

- App features: [`.cursor/rules/sdlc-for-features.mdc`](.cursor/rules/sdlc-for-features.mdc) — issue → `feature/*` branch → PR → `main`; **tests + docs required**
- Platform: spec in `docs/superpowers/specs/` → plan (optional) → implement on feature branch → merge → Vercel deploy
- P1–P3 shipped on `main` before full SDLC; no retroactive issues for that work
