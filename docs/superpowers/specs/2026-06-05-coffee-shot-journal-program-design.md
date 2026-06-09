# Coffee Shot Journal — program design spec

**Status:** Migrated from `docs/solution-discovery.md` into Superpowers spec location.  
**Scope:** Whole program (P1–P5). Per-phase implementation detail: sibling specs under `docs/superpowers/specs/`.  
**Supersedes:** Original v1 scaffold plan (empty folder → `useState` only).

---

## Summary

Long-lived **Coffee Shot Journal platform**: React web app (and later iOS) on **AWS ECS**, secrets in **HCP Vault**, provisioning via **HCP Terraform** (`tf-coffee-journal-{infra,vault}`), public at **`coffee.dev.withdevo.net`**. Today the web app is feature-rich on **IndexedDB**; urgent gap: **secure label scan** (GitHub **#1**) and secret-zero deploy before cloud migration.

## Audience

| Audience | Need |
|----------|------|
| Operator | Daily journaling; repeatable `dmtfc` + Vault bootstrap + deploy |
| Builder | Clear phase boundaries; no iOS before cloud journal |
| Reviewers / portfolio | Tests, small PRs, TFC + Vault + FQDN story |
| HashiCorp demo | Independent workspaces; reuse access patterns only |

## Problem

- Label scan uses **browser-exposed OpenAI key** — blocks safe public deploy.
- Client-only app cannot support iOS, RDS, or Vault secret zero long term.

## Desired outcomes

| Horizon | Outcome |
|---------|---------|
| P1–P2 | Public HTTPS UI + API; label scan via ECS; no prod OpenAI key in browser |
| P3 | Cognito + RDS + S3; web uses API; IndexedDB upload on sign-in |
| P4 | iOS on same API + Sign in with Apple |
| P5 | Filters, charts, export, #13–#16 |

## Repos

| Repo | Role |
|------|------|
| `coffee-shot-journal` | React SPA, tests, product docs |
| `glimpsovstar/tf-coffee-journal-infra` | ECS, ALB, CloudFront, Route53, ECR, `api/` |
| `glimpsovstar/tf-coffee-journal-vault` | Namespace, KV, policies, AWS auth |

## Phased scope

| Phase | Product | Platform |
|-------|---------|----------|
| **P1** | Journal UX unchanged | Vault NS, AWS auth skeleton, ECS/ALB/ECR, CloudFront UI, TFC workspaces |
| **P2** | Web → `api.coffee.dev.withdevo.net`; closes **#1** | `POST /v1/label-scan`; OpenAI in KV; Agent sidecar |
| **P3** | API CRUD; sign-in; local migration | Cognito, RDS, S3 photos |
| **P4** | SwiftUI client (preferred) | Same API + Cognito |
| **P5** | Export, charts, filters, edit beans | On shared API |

## Non-goals

- Deakin/AAP demo **resources** (patterns only)
- Multi-region / WAF in early phases
- Secrets in ECS task env, images, or Vite bundles (post-P2)
- iOS before P3
- PKI, Vault→GitHub/AWS SM sync (Deakin scope)

## Constraints

- **DNS:** `coffee.dev.withdevo.net`, `api.coffee.dev.withdevo.net`; zone `dev.withdevo.net.`
- **TFC:** org `djoo-hashicorp`; `tf-coffee-journal-infra`, `tf-coffee-journal-vault`
- **Vault:** cluster `djoo-test-vault-public-vault-a40e8748.a3bc1cae.z1.hashicorp.cloud:8200`; NS `coffee-shot-journal`
- **AWS:** `ap-southeast-2`; `tf-aws-network-dev` remote state; **`dmtfc`**
- **ACME:** `glimpsovstar@gmail.com`
- **ECS secrets:** Vault Agent sidecar + AWS IAM auth + ephemeral volume
- **API:** `api/` in infra repo; `terraform/tfc/` in infra repo
- Never commit secrets or tokens

## Success criteria (program)

1. Daily driver across devices (after P3/P4).
2. Safe public deploy — no client API keys; server-side label scan.
3. Platform independence — own TFC, Vault NS, FQDN, `Demo=coffee-journal`.
4. Operator runbook works cold (`docs/demo-flow.md`).
5. Tests on behavior changes; docs match reality.

## Validation (key scenarios)

| ID | Phase | Check |
|----|-------|-------|
| V-P1-1 | P1 | `curl -sI https://coffee.dev.withdevo.net` → 200 + valid TLS |
| V-P1-2 | P1 | `curl https://api.coffee.dev.withdevo.net/health` → 200 |
| V-P2-1 | P2 | Label scan: network tab → API only, not OpenAI |
| V-P2-3 | P2 | No `VITE_OPENAI_API_KEY` in prod build |
| V-P3-1 | P3 | Sign-in + CRUD survives refresh |

Full matrix: see archived `docs/solution-discovery.md` validation table.

## Execution order

**Build cycle (P1 + P2 together):**

1. Vault workspace — namespace, KV, policies, AWS auth placeholder  
2. Infra workspace — task role ARN, ECS + Agent sidecar, CloudFront, Route53  
3. Vault workspace — bind task role to AWS auth role  
4. API — health + `POST /v1/label-scan`; push image to ECR  
5. Web — prod build with API URL only; deploy UI; verify **#1** closed  

Later phases: P3 → P4/P5.

## Open questions (brainstorming)

| ID | Topic | When to resolve |
|----|-------|-----------------|
| O1 | iOS: SwiftUI vs Capacitor | Before P4 |
| O2 | P3: API-only web vs IndexedDB cache hybrid | Before P3 spec |
| O3 | Optimize for HashiCorp demo vs AWS cost | **Decided:** Balanced Fargate defaults + TF vars to scale for demos (see P1 spec) |
| O4 | AppRole for TFC: `admin` policy vs child NS provider | P1 vault (default: admin + scoped policy) |

## Related specs

- **[Vercel + Supabase single-user](2026-06-05-vercel-supabase-single-user-design.md)** — **active** implementation direction
- [P1 platform foundation (AWS)](2026-06-05-p1-platform-foundation-design.md) — **parked**
- [`constitution.md`](../../../constitution.md) — operator reference (AWS sections legacy)
- [`docs/public-hosting-plan.md`](../../public-hosting-plan.md) — diagrams (AWS-centric; update when implementing)
