# TODO

## Immediate — before trusting any of this

- [ ] **Run the real install/migrate/seed/smoke-test cycle.** See TECH_DEBT.md #9 — nothing in the Phases 2-6 pass has executed against a live server. `pnpm install && pnpm db:generate && docker compose up -d && pnpm db:migrate:dev && pnpm db:seed`, then hit a few endpoints by hand.
- [ ] Verify Better Auth's routes actually land at `/api/auth/*` and not `/api/v1/api/auth/*` — TECH_DEBT.md #10, highest-risk single integration point.
- [ ] Reconcile the hand-authored Better Auth tables (User/Session/Account/Verification/Organization/Member/Invitation) against real `npx @better-auth/cli generate` output — TECH_DEBT.md #12.
- [ ] Sign up a real user (`POST /api/auth/sign-up/email`), then run `SEED_DEMO_USER_EMAIL=you@example.com pnpm db:seed` to attach yourself to the demo workspace as Owner.

## Phase 0 / Milestone 1.1 — closed

See CHANGELOG.md for the full history — Phase 0 approved, Milestone 1.1 (monorepo/infra/env/health) shipped and documented.

## Milestone 1.2 / 1.3 / Phases 2-6 — shipped this pass, needs live verification

Everything is built: Better Auth + RBAC, Workspaces, Projects/Tasks/Comments/Attachments/Activity (Phase 2), CRM (Phase 3), Documents/Files/Knowledge (Phase 4), Finance/Billing (Phase 5), AI Layer (Phase 6), a minimal `apps/web` shell. See CHANGELOG.md's detailed entry for exactly what's in each phase and what's explicitly out of scope.

## Near-term follow-ups, roughly in priority order

- [ ] Connect Phase 4's `Embedding` table to Phase 6's AI service — nothing generates embeddings yet (TECH_DEBT.md #11)
- [ ] Real frontend: Better Auth client SDK integration, per-module pages, data fetching (TECH_DEBT.md #16) — apps/web today is a shell, not a product
- [ ] Streaming for `/chat` (TECH_DEBT.md #17)
- [ ] Goals/OKRs and Notifications endpoints — schema exists, no controllers yet (TECH_DEBT.md #18)
- [ ] Real tax calculation for invoices (currently a flat `0` placeholder)
- [ ] A second AI provider (OpenAI) to actually prove out the provider-agnostic abstraction (TECH_DEBT.md #19)
- [ ] Passkey/WebAuthn support in Better Auth (deliberately deferred, needs real rpID/rpName)

## Later phases (not started — outside this pass's scope)

- [ ] Phase 7 — Automation & Integrations (workflow builder, webhooks, API keys, public REST API, plugin foundation)
- [ ] Phase 8 — Collaboration (chat, channels, mentions, real-time notifications)
- [ ] Phase 9 — Analytics & Reporting
- [ ] Phase 10 — Enterprise & Hardening (SSO, SCIM planning, audit center, marketplace foundation, pen-test pass)
