# P1 — Platform foundation design spec

**Status:** **Superseded** for implementation by [Vercel + Supabase single-user design](2026-06-05-vercel-supabase-single-user-design.md). AWS/ECS/Vault path **parked**.

**Status (historical):** Migrated from `docs/platform-solution-discovery.md`.

---

## Summary

Provision AWS + HCP Vault for Coffee Shot Journal: UI at `coffee.dev.withdevo.net`, API at `api.coffee.dev.withdevo.net`, namespace `coffee-shot-journal`, two TFC workspaces, ECS skeleton with Vault Agent sidecar pattern, CloudFront static UI.

## Problem

Browser label scan (#1) and public deploy require ECS + Vault KV + AWS auth (secret zero), independent of other demos.

## Desired outcome (P1)

1. HTTPS UI and API hostnames resolve with valid TLS.
2. Vault namespace `coffee-shot-journal` with KV v2 and AWS auth bound to ECS task role.
3. TFC workspaces apply from VCS; AWS creds via `dmtfc`.
4. Operator bootstrap: TPM → AppRole → TFC sensitive vars (no secrets in git).
5. ECR + ECS ready for API image and `POST /v1/label-scan` (P2).

## In scope (P1)

| Area | Detail |
|------|--------|
| DNS | `coffee.dev.withdevo.net`, `api.coffee.dev.withdevo.net`; zone `dev.withdevo.net.` |
| TFC | `tf-coffee-journal-infra`, `tf-coffee-journal-vault`; org `djoo-hashicorp` |
| GitHub | `glimpsovstar/tf-coffee-journal-infra`, `glimpsovstar/tf-coffee-journal-vault` |
| Vault cluster | `djoo-test-vault-public-vault-a40e8748.a3bc1cae.z1.hashicorp.cloud:8200` |
| Vault layout | `admin` → child `coffee-shot-journal`; KV v2; AWS auth for ECS task role |
| Vault → TFC | TPM bootstrap → AppRole → KV audit copy → TFC sensitive vars on vault workspace |
| AWS | `ap-southeast-2`; `dmtfc`; remote state `tf-aws-network-dev` |
| Infra | ECS Fargate, ALB, ECR, CloudFront + S3 (UI), task IAM, Route53, TLS |
| TFC bootstrap | `terraform/tfc/` in **infra repo** (both workspaces) |
| API stub | `api/` in infra repo — health endpoint; Agent sidecar in task def |
| ACME email | `glimpsovstar@gmail.com` |

## P2 (included in first build — closes **#1**)

Deliver **with P1** in one implementation cycle:

- `POST /v1/label-scan` on ECS (request/response aligned with `src/services/labelVision.ts`)
- OpenAI key in Vault KV `secret/data/openai` only — operator bootstrap write, never in git or Vite env in prod
- Web prod build: `VITE_API_BASE_URL` only; remove reliance on `VITE_OPENAI_API_KEY` for deployed UI
- Local dev may keep `.env.local` optional for offline UI work; production path is API-only

**Validation:** V-P2-1, V-P2-2, V-P2-3; GitHub **#1** closed when merged.

## Out of scope

- RDS, Cognito, S3 photo pipeline, iOS, AAP automation (manual ECR/ECS OK)
- Standalone VPC if `tf-aws-network-dev` suffices
- Long-lived Vault tokens in task definitions

## Architecture

```
CloudFront → S3 (Vite UI)
ALB → ECS Fargate (api container + Vault Agent sidecar)
ECS task IAM role → Vault AWS auth → KV v2 (coffee-shot-journal)
TFC: tf-coffee-journal-infra | tf-coffee-journal-vault
```

**Secret injection:** Vault Agent sidecar + AWS IAM auth + **ephemeral** shared volume; API reads rendered file at startup ([HashiCorp ECS + Agent tutorial](https://developer.hashicorp.com/vault/tutorials/vault-agent/agent-aws-ecs)).

## ECS sizing (decided)

| Mode | CPU | Memory | Use |
|------|-----|--------|-----|
| **Default** | 256 (0.25 vCPU) | 512 MB | Steady personal / low-traffic |
| **Demo** | 512 (0.5 vCPU) | 1024 MB | Live demos, heavier Agent + API |

Expose as Terraform variables (e.g. `ecs_task_cpu`, `ecs_task_memory`) — no code change to scale up.

## Tagging

`Terraform=true`, `Environment=Dev`, `Owner=djoo`, `Demo=coffee-journal`

## Success criteria

1. Both TFC workspaces exist, VCS-linked, apply cleanly.
2. FQDNs + TLS work.
3. Vault isolation in `coffee-shot-journal`.
4. No `VAULT_TOKEN` in ECS task definition.
5. `docs/demo-flow.md` bootstrap path documented.
6. Stub API + Agent can read KV (proves P2 path).

## Validation

| ID | Scenario |
|----|----------|
| V1 | Second `terraform plan` — no unexpected destroys |
| V3 | `curl -sI https://coffee.dev.withdevo.net` → 200, valid cert |
| V4 | `curl -sI https://api.coffee.dev.withdevo.net/health` → 200 |
| V5 | Vault UI: namespace + KV mount |
| V6 | ECS logs: AWS auth + KV read |
| V8 | Cold operator follows `demo-flow.md` bootstrap |

## Apply order

1. Vault workspace — namespace, KV, policies, AWS auth placeholder  
2. Infra workspace — task role ARN, partial ECS  
3. Vault workspace — bind task role to AWS auth role  
4. Infra workspace — full ECS, CloudFront, Route53  

## Open questions

| ID | Status |
|----|--------|
| AppRole for TFC in `admin` vs child NS | **Default:** AppRole in `admin`, policy on `coffee-shot-journal/*` |
| Fargate task size | **Decided:** Balanced — small default (0.25 vCPU / 512 MB) with Terraform variables to scale up for demos (e.g. 0.5 vCPU / 1 GB) |
| ACME module choice | Follow existing `tf-*` AWS demo pattern in work-related repos |

## Reference patterns

- `~/Documents/work-related/dev-workspaces/tf-hcpvault-dedicated-all-in-one-ws/repo/terraform/`
- `~/Documents/work-related/scripts/vault-env.sh`
- `dmtfc <workspace-name>`
