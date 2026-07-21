# Performance Review — Phase 10

**What this is:** a static review — reading the code for obvious problems (N+1 queries, missing indexes, unbounded loops). Not a load test; this environment can't run one against a live server. Real load testing is still a TODO before production traffic.

**Date:** 2026-07-23

## Findings

### 1. N+1 query patterns — checked, none found at problematic scale
Two loops in the codebase contain an `await prisma.*` call per iteration:
- `ChatService.sendMessage`'s mention loop — one `Notification` create + one Redis publish per mentioned user. Bounded by how many people one chat message can realistically @-mention (single digits); not a concern.
- `WebhookTriggerListener.handle`'s subscription loop — one `WebhookDelivery` create + one queue enqueue per matching subscription. Bounded by how many webhook subscriptions one workspace has (expected: low single digits to low tens, not thousands).

Neither loops over a genuinely large, unbounded collection. Revisit if either assumption stops holding (e.g., a workspace with hundreds of webhook subscriptions).

### 2. Indexing — extensive throughout, not exhaustively re-audited this pass
Every model added across all ten phases has `@@index` on its common filter columns (workspace-scoped queries index `workspaceId` at minimum, often compound with a status/date field for the specific query shape a service actually runs). This was done as each model was written, not as a separate pass — meaning it hasn't been checked against *actual* query patterns from a real `EXPLAIN ANALYZE`, only against what the code obviously filters on. Worth a real index audit once there's production query-log data to check assumptions against.

### 3. `AnalyticsService`'s task-completion heuristic — found and fixed in this pass
Originally counted `openTasks` by matching `status.name !== "Done"` — a string match against the seeded default column name, not a structural "is this task done" concept. Projects with renamed or customized Kanban columns would have gotten wrong counts. **Fixed during this same review**, not just flagged: added `TaskStatus.isTerminal` (parallel to the existing `isDefault`), `ProjectsService`'s default-column creation marks "Done" as terminal, and `AnalyticsService` now filters on `isTerminal: false` instead of the column name. Noted here as an example of the kind of thing that looks fine in testing (seeded data uses the defaults) and quietly breaks for real usage — worth remembering as a pattern, not just this one instance.

### 4. Analytics queries are all live aggregates, deliberately
Every `AnalyticsService` method runs a real-time Prisma `groupBy`/`aggregate`/`findMany`-reduce against production tables — no caching, no materialized view, no CQRS projection, despite `docs/PHASE_0_ARCHITECTURE.md` flagging Analytics as the one place CQRS might be justified. This is a deliberate choice for this pass (see the schema comment on the Analytics models), not an oversight — these are simple aggregates over what should be modest per-workspace row counts at current scale. Revisit if a specific workspace's query volume or data size starts showing up as a measured problem, not preemptively.

### 5. Realtime (Phase 8) fan-out
`RealtimeService.observe()` never unsubscribes from a Redis channel once subscribed (see TECH_DEBT.md #24) — a correctness/memory note more than a throughput one at current scale, flagged there rather than duplicated here.

## Not covered by this review

- Actual query latency, actual connection pool behavior under concurrent load, actual memory profile of a running `apps/api` process — all require a live server this sandbox doesn't have
- Bundle size / cold-start time for `apps/ai-service` or `apps/web`
- Database connection pool sizing (`packages/db`'s `max: 10` in the `pg` adapter config is a reasonable default, not load-tested)
