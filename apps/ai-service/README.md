# apps/ai-service

Placeholder. Per `docs/PHASE_0_ARCHITECTURE.md` §6, this folder exists from
Phase 1 but is implemented in Phase 6 (AI Layer) — a FastAPI service exposing
a small internal API that `apps/api` calls, not user-facing directly. See the
Phase 0 architecture doc's AI Layer Design section for the intended shape
(provider-agnostic model routing, BullMQ-queued long-running tasks, `pgvector`
retrieval scoped per-organization).

No code here yet — this file exists so the directory is real in version
control, keeping the Phase 0 folder structure verifiably true today rather
than aspirational.
