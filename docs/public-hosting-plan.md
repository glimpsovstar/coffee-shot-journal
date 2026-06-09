# Public hosting & platform plan — Coffee Shot Journal

> **Status: Superseded (parked).**  
> This document describes the **parked** AWS/ECS/Vault/TFC path. **Do not implement from here.**
>
> **Active direction:** [Vercel + Supabase single-user design spec](superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md)  
> **Live app:** [https://coffeesnob.withdevo.net](https://coffeesnob.withdevo.net) (Vercel, P1 complete)  
> **Operator runbook:** [`demo-flow.md`](demo-flow.md)  
> **Constitution:** [`constitution.md`](../constitution.md) — active vs parked sections

The content below is **historical reference** for the AWS platform that was planned before the pivot to Vercel + Supabase.

---

## Product direction (parked AWS plan)

| Client | Role |
|--------|------|
| **Web** (this repo) | React SPA on S3 + CloudFront; calls `/v1/*` API |
| **iOS** (future) | SwiftUI (preferred) or wrapper; **same API** + Cognito |
| **Server** | Source of truth once cloud journal ships (until then, web stays IndexedDB for CRUD) |

The browser is **not** the long-term system of record. Plan auth, RDS, and S3 photos before the App Store build.

## Target architecture (parked)

```
                         ┌─────────────────────┐
                         │ CloudFront → S3     │
                         │ (React web UI)      │
                         └──────────┬──────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
 ┌──────▼──────┐             ┌──────▼──────┐              ┌──────▼──────┐
 │ Web client  │             │ iOS client  │              │ (future)    │
 └──────┬──────┘             └──────┬──────┘              └─────────────┘
        │                           │
        │         HTTPS + JWT (Cognito) — Phase 3+
        └───────────────────────────┼───────────────────────────┘
                                    │
                             ┌──────▼──────┐
                             │ ALB         │
                             └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │ ECS Fargate │
                             │ API service │
                             └──────┬──────┘
                    ┌──────────────┼──────────────┐
                    │              │              │
             ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
             │ RDS         │ │ S3        │ │ Cognito     │
             │ PostgreSQL  │ │ photos    │ │ users / JWT │
             └─────────────┘ └───────────┘ └─────────────┘

ECS task IAM role ──AWS auth──► HCP Vault namespace `coffee-shot-journal`
                                      └── KV v2 (OpenAI, Places, …)
```

### Why these choices were considered (long-lived + iOS)

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Compute** | ECS Fargate | Long-running API, Vault AWS auth / secret zero, room to grow |
| **Database** | RDS PostgreSQL | Beans ↔ shots, migrations, queries, export—better than DynamoDB for evolving schema |
| **Auth** | Amazon Cognito | JWT for web + iOS; plan **Sign in with Apple** for App Store |
| **Photos** | S3 + presigned URLs | Shared by web and iPhone; metadata in RDS |
| **Web static** | S3 + CloudFront | Cheap; UI separate from API |
| **Secrets** | HCP Vault KV v2 | No keys in images or Vite; ECS reads at runtime |
| **Not chosen** | Lambda-as-core, DynamoDB-only | Fine for tiny demos; weaker fit for multi-year API + iOS |

**Why parked:** Too costly and complex for a non-commercial personal app. Replaced by Vercel Hobby + Supabase Free.

## HCP Vault internal layout (parked)

**Dedicated namespace** (not shared with other demos):

```
admin/                          ← platform operator (platform ID / TFC vault workspace)
└── coffee-shot-journal/        ← this product
    ├── KV v2 mount             e.g. secret/
    │   ├── data/openai         label scan API key
    │   └── data/google/places  (later, #14)
    ├── auth/aws/               AWS auth method
    │   └── role → ECS task IAM role ARN(s)
    └── policies                least privilege per role
```

## Terraform — two workspaces (parked)

| TFC workspace | GitHub repo | Responsibility |
|---------------|-------------|----------------|
| **`tf-coffee-journal-vault`** | `glimpsovstar/tf-coffee-journal-vault` | Namespace `coffee-shot-journal`, KV v2, policies, AWS auth |
| **`tf-coffee-journal-infra`** | `glimpsovstar/tf-coffee-journal-infra` | ECS, ALB, ECR, RDS, S3, CloudFront, Cognito, Route53/TLS |

**DNS (parked):** UI `coffee.dev.withdevo.net`, API `api.coffee.dev.withdevo.net`.

## Phased rollout (parked — superseded by Vercel P1–P5)

| Phase | Deliverable | Active equivalent |
|-------|-------------|-------------------|
| **1 — Foundation** | ECS + Vault + CloudFront UI | **P1** Vercel deploy ✓ |
| **2 — Label scan (#1)** | `POST /v1/label-scan` on ECS | **P2** `/api/label-scan` on Vercel |
| **3 — Cloud journal** | Cognito, RDS, S3, web API | **P3** Supabase + Passkey |
| **4 — iOS app** | SwiftUI + Cognito API | **P4** SwiftUI + Supabase |
| **5 — Product** | #13–#16, export, charts | **P5** same backlog |

## Related specs

| Spec | Status |
|------|--------|
| [`2026-06-05-vercel-supabase-single-user-design.md`](superpowers/specs/2026-06-05-vercel-supabase-single-user-design.md) | **Active** |
| [`2026-06-05-p1-platform-foundation-design.md`](superpowers/specs/2026-06-05-p1-platform-foundation-design.md) | **Parked** (AWS P1) |
