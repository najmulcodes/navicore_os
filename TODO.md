# TODO

**Start here: `docs/LAUNCH_CHECKLIST.md`** — it consolidates everything below into an ordered, actionable list. This file is the working backlog; that one is the "what actually blocks real users" filter over it.

## Immediate — before trusting any of this

- [x] Sign-up endpoint verified live (2026-07-20)
- [x] Test-mode Stripe checkout verified end-to-end (2026-07-20)
- [x] Automation relay + webhook signing verified live, retry-counter fix confirmed correct (2026-07-21)
- [ ] Verify Phase 8's SSE/Redis pub/sub stream actually delivers a live event to a connected client
- [ ] Reconcile the hand-authored Better Auth tables against real `npx @better-auth/cli generate` output (TECH_DEBT.md #12)
- [ ] Run `pnpm audit` / `npm audit` — never done this session

## Shipped — Phase 0 through Phase 10

See CHANGELOG.md for the full history. Every phase in the original roadmap has real, working code against a 55-model schema: Core Platform, Work Management, CRM & Sales, Knowledge & Documents, Finance & Billing, AI Layer, Automation & Integrations, Collaboration, Analytics & Reporting, and Enterprise & Hardening.

## Near-term follow-ups, roughly in priority order

- [ ] MIME-type allowlist on file uploads (TECH_DEBT.md #29) — flagged launch-blocking
- [ ] Connect Phase 4's `Embedding` table to Phase 6's AI service — nothing generates embeddings yet (TECH_DEBT.md #11)
- [ ] Real frontend built against `packages/ui`'s corrected design tokens: Better Auth client SDK, per-module pages, SSE client, real data fetching (TECH_DEBT.md #16) — apps/web today is a shell
- [ ] Per-organization rate limiting, not just per-IP (TECH_DEBT.md #28)
- [ ] Wire `hasResourcePermission` into at least one controller to prove out advanced permissions (TECH_DEBT.md #27)
- [ ] Real tax calculation for invoices (currently a flat `0` placeholder)
- [ ] Streaming for `/chat` (TECH_DEBT.md #17)
- [ ] Per-key API key scoping — currently org-admin-equivalent (TECH_DEBT.md #20)
- [ ] A real condition/rule engine for Workflows — currently flat equality only (TECH_DEBT.md #21)
- [ ] Video room creation endpoint — provider decided (Daily.co, ADR-005), not implemented (TECH_DEBT.md #26)
- [ ] Confirm Better Auth's actual SCIM offering before committing to it (ADR-006, TECH_DEBT.md #30)
- [ ] Install `@better-auth/sso`, build the "connect your IdP" flow (ADR-006)
- [ ] Unread-message-count endpoint — schema field exists, no endpoint (TECH_DEBT.md #25)
- [ ] Goals/OKRs and Notifications-list endpoints — schema exists, no controllers yet (TECH_DEBT.md #18)
- [ ] A second AI provider (OpenAI) to actually prove out the provider-agnostic abstraction (TECH_DEBT.md #19)
- [ ] Passkey/WebAuthn support in Better Auth (deliberately deferred, needs real rpID/rpName)

## Explicitly deferred by design

- [ ] A real plugin execution runtime beyond the integration registry (TECH_DEBT.md #31)
- [ ] CQRS/materialized Analytics — only if query load becomes a measured problem (PERFORMANCE_REVIEW.md #4)
