# Launch Checklist

Everything below is pulled from `CHANGELOG.md` and `TECH_DEBT.md` across all ten phases — this doc doesn't introduce new findings, it's the "must-do before real users touch this" subset, in order.

## Blocking — do these first

- [ ] **Run the full install/migrate/seed cycle against a real Postgres and Redis.** Nothing past Milestone 1.2's specific verified paths (sign-up, Stripe checkout, automation relay, webhook signing) has run against a live server. See `TODO.md`'s Immediate section.
- [ ] Reconcile the hand-authored Better Auth tables against real `npx @better-auth/cli generate` output (`TECH_DEBT.md` #12) — this is the schema Better Auth actually depends on to function; a mismatch here breaks auth entirely, not just degrades it.
- [ ] Add a MIME-type allowlist to file uploads (`SECURITY_REVIEW.md` #1) — currently any file type is accepted.
- [x] Fix `TaskStatus`'s completion heuristic (`PERFORMANCE_REVIEW.md` #3) — done in this same pass, not deferred: `isTerminal` field added, `ProjectsService` and `AnalyticsService` updated.

## Should-do before charging real customers

- [ ] Real tax calculation for invoices (currently a flat `0` placeholder — `CHANGELOG.md`'s Phase 5 entry)
- [ ] Verify Stripe webhook handling beyond `checkout.session.completed` — subscription update/cancel paths are unexercised live (`TECH_DEBT.md` #13)
- [ ] Per-organization rate limiting, not just per-IP (`SECURITY_REVIEW.md` #7) — the Security section of the original architecture doc called for both from the start
- [ ] Run `pnpm audit` / `npm audit` — not done at any point this session

## Should-do before enterprise/large-org customers specifically

- [ ] SSO (`docs/adr/006-sso-scim-planning.md` — plugin picked, not installed)
- [ ] Per-key API key scoping instead of org-admin-equivalent (`TECH_DEBT.md` #20)
- [ ] Confirm Better Auth's actual SCIM story before promising it to anyone (ADR-006's open decision)

## Real frontend, not the current shell

`apps/web` is a shell — sidebar, command palette, one dashboard page with hardcoded example numbers. Before launch this needs, at minimum:
- [ ] Better Auth client SDK wired up (sign-in/sign-up/session UI)
- [ ] Real pages per module, real data fetching from `apps/api`
- [ ] An SSE client consuming Phase 8's realtime stream
- [ ] Everything built against `packages/ui/design-tokens.md` (the corrected navicore.co brand system — see the note in `docs/PHASE_0_ARCHITECTURE.md` §8.5), not the earlier generic reference

## Explicitly NOT blocking (deferred by design, not oversight)

These were deliberately scoped out or down — see the cited entries for the reasoning, not just the fact:
- Plugin/marketplace runtime beyond the registry foundation (`TECH_DEBT.md` #23)
- A real condition/rule engine for Workflows (`TECH_DEBT.md` #21) — flat equality covers the common case
- Streaming `/chat` responses (`TECH_DEBT.md` #17)
- A second AI provider proving out the abstraction (`TECH_DEBT.md` #19)
- Video room creation implementation (`TECH_DEBT.md` #26) — provider decided (ADR-005), endpoint not built
- CQRS/materialized Analytics (`PERFORMANCE_REVIEW.md` #4) — revisit only if actually measured as a problem

## How to use this doc

Don't treat "not blocking" as "safe to ignore forever" — it's "safe to ship without, revisit when the specific trigger condition in the linked entry actually occurs." Everything in the Blocking section has a concrete, specific failure mode attached to it, not just a vague "should probably fix this."
