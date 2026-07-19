# ADR-004: Hosting Split — Vercel (web) + Railway (API/AI/workers) + Managed Postgres/Redis

**Status:** Accepted
**Date:** 2026-07-18 (Postgres vendor sub-decision confirmed 2026-07-18)
**Deciders:** Founder/CTO

## Context

Three different workload shapes need hosting: a Next.js frontend (best served by Vercel's edge/ISR model), a stateful NestJS API + FastAPI AI service + BullMQ workers (long-running processes, not a fit for serverless functions), and managed Postgres + Redis. The question is how much of this to consolidate onto one vendor versus splitting by workload type.

## Decision

Vercel for `apps/web`. Railway for `apps/api`, `apps/ai-service`, and BullMQ workers. Managed Postgres on **Supabase** (Redis on Railway) — see the confirmed sub-decision below.

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

## Sub-Decision: Where Does Postgres Live? — Confirmed: Supabase

**Correction (2026-07-18):** the original draft of this ADR justified Supabase partly on `pgvector` support. That's not a valid differentiator — `pgvector` is a standard Postgres extension, not a Supabase-exclusive feature, and Railway Postgres supports it too (via Railway's pgvector-enabled Postgres image/template). Both options give `pgvector` equally; it plays no role in this decision.

- **Supabase Postgres:** same vendor as Supabase Storage (already chosen for file storage) — one dashboard, one bill, one auth/networking model covering both DB and object storage.
- **Railway Postgres:** same vendor as `apps/api`/`apps/ai-service`/workers/Redis — one fewer vendor overall, simpler private networking (same VPC) between compute and DB.

**Confirmed: Supabase Postgres.** The actual reason is one-vendor ergonomics: Storage is already committed to Supabase, so putting the database there too means one dashboard, one bill, and one place to manage DB + Storage access policies together, at the cost of the DB being one hop outside the Railway VPC that `apps/api`/workers/Redis live in. That cross-VPC hop is the real trade-off this decision makes (see Action Items below for how it's handled), not a `pgvector` capability gap.

## Consequences

- Easier: each workload runs on infrastructure suited to it; low operational overhead; horizontal scaling of `apps/api`/workers on Railway is a config change, not an infra project.
- Harder: two vendors to monitor instead of one; connection pooling from Railway-hosted services to an external (Supabase) Postgres needs explicit configuration (e.g. PgBouncer/Supabase's pooler) rather than being free same-VPC networking.
- Revisit trigger: if Railway or Vercel pricing/reliability becomes a problem at real scale, or if an enterprise customer's procurement requirements (Phase 10) demand a specific cloud (AWS/GCP/Azure) NAVICORE doesn't currently run on.

## Action Items

1. [x] Decide Supabase Postgres vs. Railway Postgres — **confirmed Supabase**, 2026-07-18
2. [ ] Confirm Redis is Railway-managed (co-located with `apps/api`/workers), since BullMQ's latency to Redis matters more than its latency to Postgres
3. [ ] **Phase 1:** configure Prisma with two connection strings against Supabase's Supavisor pooler, not one — `DATABASE_URL` (pooled, `?pgbouncer=true`, used by `apps/api`/`apps/ai-service`/workers at runtime) and `DIRECT_URL` (unpooled, used only by `prisma migrate`). Prisma's own migration engine needs a direct connection — it doesn't work reliably through Supavisor's transaction-mode pooler — while every long-running app process should go through the pooler rather than holding its own direct connection open. Both env vars are validated by `packages/config`'s Zod schema at boot.
