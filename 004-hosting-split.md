# ADR-004: Hosting Split — Vercel (web) + Railway (API/AI/workers) + Managed Postgres/Redis

**Status:** Proposed — one sub-decision (Postgres vendor) explicitly open
**Date:** 2026-07-18
**Deciders:** Founder/CTO

## Context

Three different workload shapes need hosting: a Next.js frontend (best served by Vercel's edge/ISR model), a stateful NestJS API + FastAPI AI service + BullMQ workers (long-running processes, not a fit for serverless functions), and managed Postgres + Redis. The question is how much of this to consolidate onto one vendor versus splitting by workload type.

## Decision

Vercel for `apps/web`. Railway for `apps/api`, `apps/ai-service`, and BullMQ workers. Managed Postgres and Redis, hosted separately from application compute — **with the Postgres vendor itself still an open sub-decision** (see below).

## Options Considered

### Option A: Vercel (web) + Railway (everything else) — chosen
| Dimension | Assessment |
|---|---|
| Complexity | Low-Medium — two dashboards, but each is doing what it's actually good at |
| Cost | Reasonable at low-mid scale; both have usage-based pricing that tracks actual load |
| Scalability | Good — Railway scales long-running services and workers properly; Vercel scales the frontend properly. Neither is being asked to do the other's job |
| Team familiarity | High — both are widely documented, low-ops |

**Pros:** Next.js on Vercel gets ISR/edge features NestJS-on-Vercel-functions would fight against; NestJS/FastAPI/BullMQ workers need long-running processes and persistent connections (to Postgres, to Redis) that serverless functions handle awkwardly at best; low operational overhead for a team of one/few.
**Cons:** two billing relationships and two places to check when something's down instead of one; cross-vendor networking (Railway → external Postgres) needs care around connection pooling and latency.

### Option B: Vercel end-to-end (serverless functions for the API too)
**Pros:** one vendor, one bill.
**Cons:** NestJS as a serverless function fights the framework's assumptions (long-lived DI container, persistent connections); BullMQ workers need a real long-running process, which Vercel functions structurally aren't. Would mean either abandoning NestJS's module system or running a second host for workers anyway — at which point it's not actually one vendor.

### Option C: Single cloud, self-managed (AWS/GCP/Azure end-to-end)
**Pros:** maximum control, one vendor, standard enterprise procurement story for later.
**Cons:** meaningfully more DevOps surface (VPCs, load balancers, autoscaling groups, managed-service configuration) than a pre-PMF team needs to be running by hand. Right choice once there's a platform/infra function to own it — not now, and the observability section of the stack notes already defers self-hosted Prometheus/Grafana/Loki for exactly this reason.

### Option D: Self-hosted VPS (single box or small cluster)
**Cons:** all the operational burden of Option C plus none of the managed-service safety net (backups, failover, patching). Not defensible at this stage.

## Open Sub-Decision: Where Does Postgres Live?

Not resolved by this ADR — flagged explicitly so it doesn't get silently assumed away.

- **Supabase Postgres:** same vendor as Supabase Storage (already chosen for file storage), native `pgvector` support with no extra setup, one dashboard covering both DB and storage.
- **Railway Postgres:** same vendor as `apps/api`/`apps/ai-service`/workers/Redis, simpler private networking (same VPC), one fewer vendor overall.

**Default assumption used elsewhere in this document set: Supabase Postgres**, mainly because Storage is already there and native `pgvector` removes a step for Phase 4/6. This is a genuinely close call and should be confirmed, not inherited by default — see `TODO.md` and `TECH_DEBT.md` #2.

## Consequences

- Easier: each workload runs on infrastructure suited to it; low operational overhead; horizontal scaling of `apps/api`/workers on Railway is a config change, not an infra project.
- Harder: two vendors to monitor instead of one; connection pooling from Railway-hosted services to an external (Supabase) Postgres needs explicit configuration (e.g. PgBouncer/Supabase's pooler) rather than being free same-VPC networking.
- Revisit trigger: if Railway or Vercel pricing/reliability becomes a problem at real scale, or if an enterprise customer's procurement requirements (Phase 10) demand a specific cloud (AWS/GCP/Azure) NAVICORE doesn't currently run on.

## Action Items

1. [ ] Decide Supabase Postgres vs. Railway Postgres before Phase 1's Docker Compose / CI provisioning is written — this changes local dev connection-string setup either way
2. [ ] Confirm Redis is Railway-managed (co-located with `apps/api`/workers) regardless of the Postgres decision, since BullMQ's latency to Redis matters more than its latency to Postgres
3. [ ] Set up connection pooling (Supabase's built-in pooler, or PgBouncer if Railway Postgres is chosen instead) before load testing anything in Phase 1
