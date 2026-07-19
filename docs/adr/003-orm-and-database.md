# ADR-003: ORM & Database — Prisma 7 + PostgreSQL + pgvector

**Status:** Accepted
**Date:** 2026-07-18
**Deciders:** Founder/CTO

## Context

Every module in NAVICORE OS is relational at its core (orgs → workspaces → projects → tasks, companies → contacts → deals), with one clear future need for vector search: RAG over the Knowledge base and NL search (Phase 6). The question is both "which ORM" and "does the vector-search need justify a separate search/vector database now."

## Decision

Prisma 7 as the ORM, PostgreSQL as the only database, with the `pgvector` extension enabled when Phase 4/6 actually need it — not before.

## Options Considered

### Option A: Prisma + PostgreSQL (+ pgvector when needed)
| Dimension | Assessment |
|---|---|
| Complexity | Low — one database to run, back up, and reason about transactionally |
| Cost | One managed Postgres instance instead of Postgres + a separate vector/search store |
| Scalability | Postgres FTS + pgvector comfortably covers NL search, RAG, and knowledge retrieval well past the point NAVICORE needs to worry about it |
| Team familiarity | High — Prisma is the most widely used TS ORM, migrations are declarative and reviewable |

**Pros:** migrations-as-code and a single source of schema truth (exactly what Phase 0's "design the full schema before writing application code" rule assumes); one database means one transaction boundary — a `Deal` and its `DealStageHistory` row commit together, not eventually-consistent across two systems; `pgvector` means embeddings live next to the rows they describe instead of a separate sync pipeline to keep two stores consistent.
**Cons:** Prisma can't express true polymorphic associations (see the `Comment`/`Attachment` note in the architecture doc) — a real, if minor, modeling limitation; `pgvector` is not as fast at very large-scale ANN search as a purpose-built vector database, which is a real ceiling, just not one this product is anywhere near yet.

### Option B: Drizzle + PostgreSQL
**Pros:** lighter weight, SQL-closer, often faster cold-start than Prisma.
**Cons:** less mature migration tooling and ecosystem than Prisma at the time of this decision; team familiarity and the surrounding tooling (Prisma Studio, seed workflows) favor Prisma for a team moving fast solo. Worth revisiting only if Prisma's query performance becomes an actual bottleneck.

### Option C: TypeORM
**Cons:** Active Record and Data Mapper patterns both available, which in practice means inconsistent usage across a codebase over time; migration story is weaker than Prisma's; not chosen.

### Option D: Raw SQL / query builder (Knex, Kysely)
**Pros:** maximum control, no ORM abstraction cost.
**Cons:** hand-written migrations and no generated types across `apps/api` and `apps/web` boundaries — directly works against the "DTOs at every boundary, typed everywhere" principle. Right choice for a team that already knows exactly what they're optimizing for; not the right starting point here.

### Option E: Separate vector/search store now (OpenSearch, Elasticsearch, Pinecone)
**Cons:** a second database to run, back up, and keep consistent with Postgres before there's a single feature (Knowledge base doesn't ship until Phase 4, RAG until Phase 6) that needs it. Classic premature infrastructure investment — explicitly the trade the original stack notes already call out ("don't stand up OpenSearch/Elasticsearch until scale actually demands it").

## Trade-off Analysis

The ORM choice (Prisma vs. Drizzle vs. TypeORM) is close but not high-stakes — all three can be swapped later behind the repository pattern without touching domain logic, since repositories are the only layer that talks to Prisma directly. The database choice (one Postgres vs. Postgres + a vector store) is the higher-stakes call, and the answer is clearly "one, until proven otherwise": nothing in the Phase 0–3 scope touches embeddings at all.

## Consequences

- Easier: one backup/restore story, one connection pool to manage, transactional integrity across related writes, generated types shared via the repository layer.
- Harder: the polymorphic `Comment`/`Attachment` modeling needs an app-layer integrity check instead of a DB-enforced FK (documented, not hidden); very-large-scale vector search would eventually need re-evaluating against a purpose-built store — not a Phase 0–6 concern.
- Revisit trigger: if `pgvector` query latency becomes a measured problem once Phase 6 RAG is live and under real load — not before.

## Action Items

1. [ ] Confirm Prisma 7 is still current at Phase 1 scaffolding time (stack notes explicitly flag verifying versions)
2. [ ] Enable the `pgvector` Postgres extension when Phase 4 (Knowledge & Documents) introduces the first embedding column — not in Phase 0/1
3. [ ] Keep all Prisma access behind repository classes per module, so a future ORM swap (if ever needed) doesn't touch domain/application code
