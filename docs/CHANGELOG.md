# Changelog

All notable milestones for NAVICORE OS, per the project's phase-gated process. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); entries are per-milestone rather than per-release since nothing has shipped to users yet.

## [Phase 0] — 2026-07-18 — Product & Architecture

### Added
- MVP wedge definition: Core Platform + Work Management + CRM & Sales, targeting a founder-led studio/venture-builder persona (`docs/PHASE_0_ARCHITECTURE.md` §1)
- Module boundaries and cross-module communication rule for Phase 0–3 scope (§2)
- ER design (Mermaid diagram) and Prisma schema skeleton scoped to the MVP wedge (`prisma/schema.prisma`)
- Role/permission matrix for Owner/Admin/Member/Guest (§4)
- API conventions: versioning, envelope shape, error codes, pagination, idempotency (§5)
- Monorepo folder structure (§6)
- 4 ADRs: monorepo tool, auth provider, ORM/database, hosting split (`docs/adr/`)
- Deployment architecture, with Postgres vendor flagged as an open decision (§7)
- Coding standards (§8)
- Phase 0 acceptance criteria (§9)
- `TODO.md` and `TECH_DEBT.md` initialized

### Status
No application code written. Nothing deployed. Pending founder/CTO sign-off before Phase 1 opens.

## [Phase 0] — 2026-07-18 — Approved with correction

### Changed
- MVP wedge (persona + Core Platform/Work Management/CRM & Sales scope) confirmed as-is, no changes
- Postgres vendor confirmed: **Supabase**
- **ADR-004 corrected:** the original rationale cited `pgvector` as a Supabase differentiator. That's inaccurate — `pgvector` is a standard Postgres extension available on Railway Postgres too. The actual, corrected rationale is one-vendor ergonomics (Storage is already on Supabase). `docs/PHASE_0_ARCHITECTURE.md` §7 updated to match.
- ADR-004 Action Items updated: added Phase 1 item for Prisma's dual connection-string setup against Supabase's Supavisor pooler — pooled `DATABASE_URL` (`?pgbouncer=true`) for app runtime, direct `DIRECT_URL` for `prisma migrate`
- All 4 ADRs moved Proposed → Accepted
- `TECH_DEBT.md` #2 (Postgres vendor undecided) resolved and moved to the Resolved log
- `TODO.md` restructured: Phase 0 closed, Phase 1 opened and split into milestones 1.1 (monorepo/infra), 1.2 (auth/multi-tenancy), 1.3 (app shell)

### Status
**Phase 0 closed.** Phase 1 (Foundation) is open — starting with Milestone 1.1.

## [Phase 1 — Milestone 1.1] — 2026-07-18 — Monorepo, infra, env, health check

### Added
- Turborepo + pnpm workspace scaffold (`turbo.json`, `pnpm-workspace.yaml`, root `package.json`)
- `docker-compose.yml`: local Postgres (`pgvector/pgvector:pg16` — pgvector-ready ahead of Phase 4) + Redis
- `packages/config`: fail-fast Zod-validated env schema (`loadEnv()`), consumed at the top of `apps/api`'s `main.ts`
- `packages/db`: Prisma 7 client singleton wired with `@prisma/adapter-pg` against the pooled `DATABASE_URL`, sane pool/timeout settings — **new package beyond the Phase 0 folder structure, flagged in its own README**
- `apps/api`: NestJS 11 skeleton (CommonJS, SWC builder) with a real `GET /health` endpoint backed by hand-rolled Prisma and Redis Terminus indicators (current `HealthIndicatorService` API, not the deprecated `HealthIndicator` base class)
- `apps/ai-service`: placeholder folder + README (implemented Phase 6, per §6)
- `.github/workflows/ci.yml`: lint → typecheck → test → build → e2e, against real Postgres/Redis service containers
- Root ESLint flat config (`eslint.config.mjs`)
- `prisma.config.ts`: Prisma 7's new CLI connection config, pointed at `DIRECT_URL`

### Corrected during implementation (verified against current docs/registry, not assumed from training data)
- **Prisma 7 connection model**: the Phase 0 schema skeleton used Prisma 6-style `datasource db { url = env(...) }`, which Prisma 7 rejects outright. Connection info now lives in `prisma.config.ts` (CLI/migrations) with the app runtime using a driver adapter (`packages/db`). Schema's `generator` block also needed `moduleFormat = "cjs"` — Prisma 7 ships ESM by default, which NestJS's CommonJS setup can't consume directly (NestJS's own official Prisma recipe documents this exact fix).
- **pnpm 11.12.0 is a broken release** (confirmed via `pnpm install` itself refusing to install it — "shipped without a binary"). Pinned `packageManager` to the actual current stable, 11.14.0, confirmed against npm's own dist-tags.
- **TypeScript 7.0** (native Go compiler, GA July 8, 2026 — 10 days before this session) breaks `typescript-eslint` and `ts-jest`, both used here; the compatible fix lands in 7.1, not yet released. Pinned to TypeScript 6.0.3 (the JS-based "bridge" release) instead of the version originally drafted from stale assumptions.
- **`moduleResolution: "node10"` is a hard compiler error on TypeScript 6.0.3**, not a future-only deprecation as initially assumed — confirmed directly against the installed compiler (`TS5107`). Switched to `"nodenext"` across all three TS packages, verified clean with zero errors against the real compiler on `packages/config`.
- Verified current major versions for Next.js (16.2.x), NestJS (11.1.x — v12/ESM migration not yet released), Prisma (7.7.x), Turborepo (2.10.x), Better Auth (1.6.x), Zod (4.x) before pinning anything, per the original build prompt's own instruction to verify versions before Phase 1 scaffolding.

### Verified, not just written
- Every dependency version pin across all four `package.json` files resolves on the npm registry (checked individually via `npm view`)
- `prisma.config.ts` loads correctly and `prisma/schema.prisma` parses without error (confirmed via a real `prisma generate` invocation — it reached the engine-binary-download step before failing on this sandbox's network policy, which blocks `binaries.prisma.sh`; not a defect in the schema/config)
- `packages/config` typechecks with zero errors against the real, installed TypeScript 6.0.3 compiler

### Known gaps (this sandbox, not the deliverable)
- Could not complete a full `pnpm install` in this container — its filesystem doesn't support symlinks (`ENOSYS`), which pnpm's content-addressable store depends on even in hoisted mode. `npm install` worked cleanly in an isolated test. Run the real install in a normal environment (local machine, CI, Claude Code) — see `TECH_DEBT.md`.
- `apps/api`'s typecheck/build/tests were not run end-to-end here (blocked by the same install limitation) — the `nodenext`/`types` fix was validated directly on `packages/config` with the real compiler and applied to `apps/api`/`packages/db` by the same, confirmed pattern, but hasn't been run in situ.

### Status
Milestone 1.1 code-complete. Milestones 1.2 (Better Auth, Organizations, Workspaces, RBAC) and 1.3 (NestJS module skeleton, Next.js app shell) remain before Phase 1 closes.

## [Milestone 1.2, Milestone 1.3, Phases 2-6] — 2026-07-19 — Full-stack pass, all phases through the AI Layer

**Context:** approved to move fast without per-phase STOP-gate sign-off ("if anything breaks afterward we can fix that"). Everything below is real, working code against the schema — not mocked — but hasn't been exercised against a live server in this sandbox (see "Known gaps" below). Read this entry before touching the codebase; it's the map of what to trust versus what to verify first.

### Schema
- `prisma/schema.prisma` grew from the Phase 0 MVP-wedge skeleton to 42 models / 15 enums: Better Auth's core tables (User/Session/Account/Verification/Organization/Member/Invitation, hand-authored per ADR-002 — reconcile against the real CLI generator output before this ships), all of Phases 2-6's domain models (Goal, TimeEntry, Notification, Folder/FileAsset/Document/DocumentVersion/DocumentApproval/KnowledgeArticle/Embedding, Invoice/InvoiceLineItem/Expense/Budget/Payment/Plan/Subscription, AiConversation/AiMessage).
- `pgvector` extension turned on (`Embedding.embedding Unsupported("vector(1536)")`) — Phase 4 trigger point per ADR-003. No vector index yet; add via a hand-edited raw-SQL migration before real RAG query volume.
- Passed a real structural validation (relation field/reference integrity, brace balance, named-relation pairing) via a custom static checker — this sandbox cannot run Prisma's actual schema engine (network policy blocks `binaries.prisma.sh`, not in the allowed domain list). **Never actually validated against a live Postgres instance.**

### Milestone 1.2 — Auth & multi-tenancy
- Better Auth wired via `@thallesp/nestjs-better-auth` (the package Better Auth's own docs point to for NestJS) — email/password + Google/GitHub OAuth (opt-in, paired-or-neither validated) + TOTP MFA (`twoFactor()` plugin) + organization plugin. Passkey/WebAuthn deliberately not wired — needs a real rpID/rpName pair, no sensible default; see TECH_DEBT.md.
- `apps/api/src/lib/session.ts` resolves sessions via `auth.api.getSession()` directly — Better Auth's own documented API — rather than an undocumented request property from the NestJS integration package, to avoid depending on internals this session couldn't verify.
- Full RBAC: `PermissionGuard` (workspace-scoped, `:workspaceId` route param) and `OrgRoleGuard` (org-scoped, `:organizationId` route param, for actions like workspace:create that happen before any workspace exists) — deliberately separate because Better Auth's own coarse org role and this codebase's fine-grained Role/Permission system are different layers (ADR-002).
- `prisma/seed.ts` seeds the complete §4 permission matrix (plus Phase 4-6 additions with the same shape) into real Role/Permission/RolePermission rows, plus a demo org/workspace/pipeline. Does not create login credentials — deliberately (see the script's own docstring on why hand-seeding a User/Account row with a guessed password hash was rejected as unsafe).
- **Known real gap, not just caution:** Better Auth's routes need `bodyParser: false` at the Nest level (done, `main.ts`) and a global-prefix exclusion so they land at `/api/auth/*` instead of `/api/v1/api/auth/*` (done, but flagged — Express 5's wildcard route syntax changed and this exact exclusion pattern hasn't been smoke-tested against a live server).

### Milestone 1.3 — App shell
- All Phase 1-6 modules wired into `app.module.ts` (see the file itself for the full list) — `EventEmitterModule.forRoot({ wildcard: true })` powers the domain-event → ActivityLog pattern designed in Phase 0 §2.
- `apps/web`: real Next.js 16 + Tailwind v4 shell — sidebar, topbar, a functional Cmd+K command palette (real keyboard handling; the command list itself is placeholder, not wired to navigation yet), dark theme using NAVICORE's established cyan/gold brand tokens. One page. Everything else (real routes per module, data fetching, forms) is next-session scope — this is Milestone 1.3's shell requirement, not a finished frontend.

### Phase 2 — Work Management
Projects (CRUD, auto-creates default Kanban columns), Tasks (CRUD, Kanban move/reorder, time entries, "own only" ownership enforcement for Members per §4), Comments (polymorphic across Task/Deal/Document with application-layer entityId existence checks), Attachments (Supabase Storage, polymorphic), Activity feed (cursor-paginated read + the wildcard event listener that populates it). **Not exposed via endpoints yet, schema-only:** Goals/OKRs, Notifications — see TECH_DEBT.md.

### Phase 3 — CRM & Sales
Companies, Contacts, Pipeline stages, Deals — with `DealStageHistory` written transactionally on every stage move and a `deal.stage_changed` domain event.

### Phase 4 — Knowledge & Documents
Documents with real versioning (`DocumentVersion`) and an approval workflow (`DocumentApproval`), Folder/FileAsset file manager via the shared `StorageService`, Knowledge base articles with a **real** Postgres full-text search endpoint (raw `to_tsvector`/`plainto_tsquery` SQL, not a stub) across articles and document content. This is the keyword-search foundation Phase 0 §6 describes as "not yet AI-powered" — it is explicitly not the pgvector/RAG semantic search path, which is Phase 6's `Embedding` model plus `apps/ai-service` (not yet connected to each other — see TECH_DEBT.md).

### Phase 5 — Finance & Billing
Invoices (with computed line-item totals), Expenses (submit/approve/reimburse), Budgets (with utilization-against-actuals calculation), and NAVICORE's own platform subscription billing via Stripe (`BillingModule`: checkout session creation + a webhook handler covering `checkout.session.completed` and subscription update/delete events, with correct raw-body handling for signature verification via a scoped `express.raw()` middleware). **Needs a real `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` to do anything — structurally complete, functionally unverified.** Tax calculation is a flat placeholder (`taxCents = 0`); see TECH_DEBT.md.

### Phase 6 — AI Layer
- `apps/ai-service`: a real FastAPI app, not a stub — provider-agnostic routing abstraction (`AIProvider` ABC), a working `AnthropicProvider` implementation, `/chat` and `/summarize` endpoints, internal-API-key auth (this service isn't meant to be internet-facing), `requirements.txt` with versions verified against PyPI this session, a `Dockerfile` for Railway. Only the Anthropic provider is implemented — the interface is real and swappable but unproven against a second provider.
- `apps/api`'s `AiModule`: `AiConversation`/`AiMessage` persistence, a thin HTTP client to the FastAPI service (Node's built-in `fetch`, no new HTTP dependency), a `/summarize` proxy endpoint.
- **Needs a real `ANTHROPIC_API_KEY` and `INTERNAL_AI_API_KEY` (shared secret, both sides) to do anything.** No streaming (single-turn request/response only), no RAG/embedding generation wired to the `Embedding` table yet, no agent framework/tool-use.

### Verified this pass (registry/config-level, not live-server)
- Every new npm package version pin (`better-auth`, `@thallesp/nestjs-better-auth`, `stripe`, `@supabase/supabase-js`, `multer`, `class-validator`/`class-transformer`, `@nestjs/event-emitter`, `express`, `next`/`react`/`react-dom`/`tailwindcss`/`@tailwindcss/postcss`) resolves on the npm registry.
- Every Python package version in `apps/ai-service/requirements.txt` verified against PyPI.
- Tailwind v4's actual CSS-first setup (`@tailwindcss/postcss`, `@theme`, `@custom-variant dark`) — the originally-drafted config used Tailwind v3's `tailwind.config.js` + `autoprefixer` pattern, corrected after checking current docs.
- A custom static checker across all 72 `apps/api` TypeScript files: brace/paren/bracket balance and relative-import resolution — zero real errors found (a couple of comment-parsing false positives in the checker itself, manually confirmed as such).
- No duplicate or obviously-conflicting controller route paths across all 24 controllers.

### Known gaps (be honest with yourself before deploying this)
- **Nothing in this pass has run against a live Postgres, a live Better Auth flow, a live Stripe account, or a live Anthropic API call.** Every correction this session came from registry checks, doc verification, and static analysis — not execution. Run `pnpm install && pnpm db:generate && pnpm db:migrate:dev && pnpm db:seed` and then actually hit the endpoints before trusting this in front of a real user.
- Better Auth's route-mounting/prefix-exclusion interaction (see Milestone 1.2 above) is the single highest-risk unverified integration point — check this first.
- `apps/web` is a shell, not a product — one page, no auth flow wired to Better Auth's client SDK, no real data fetching from `apps/api`.
- See `TECH_DEBT.md` for the full, scored list — it grew substantially this pass and is worth reading before continuing.

## [Post-pass verification] — 2026-07-20

Independently verified (not by this session — by the founder, against a real running instance):
- Stripe webhook signature handling — correct
- `disableGlobalAuthGuard: true` — correctly relies on this codebase's own RBAC rather than Better Auth's global guard, as designed
- No hardcoded secrets
- `POST /api/auth/sign-up/email` resolves correctly — **TECH_DEBT.md #10 (Better Auth route-mounting risk) is resolved**, the global-prefix exclusion pattern works as written
- Test-mode Stripe checkout completed end-to-end — **TECH_DEBT.md #13 (Stripe billing unverified) is resolved** for the checkout path (webhook event handling beyond `checkout.session.completed` still unexercised)

### Corrected
- `apps/api/src/lib/auth.ts`'s comment claimed Resend was already set up for `navicore.co` — wrong, it's Zoho Mail. Comment fixed; no code change, since email verification isn't wired up either way yet.

## [Phase 7] — 2026-07-21 — Automation & Integrations

### Added
- Schema: 6 new models (`Workflow`, `WorkflowAction`, `WorkflowRun`, `WebhookSubscription`, `WebhookDelivery`, `ApiKey`) — 48 models / 18 enums total, structurally validated clean (relation integrity, brace balance, no route conflicts across all 27 controllers).
- **Durable automation trigger relay** (`AutomationTriggerListener` → BullMQ → `AutomationProcessor`): this is the actual fix for the tech-debt item flagged all the way back in Phase 0 planning — domain events now survive a worker-process restart instead of only existing in-process via `EventEmitter2`. Same wildcard-subscription pattern as `ActivityListener`, different destination.
- Workflow engine: triggers reuse the existing domain-event system (no new event infrastructure needed), flat-equality condition matching against event metadata (deliberately not a general rule/expression language — see TECH_DEBT.md), three action types (`CREATE_TASK`, `SEND_WEBHOOK`, `CREATE_NOTIFICATION`), append-only `WorkflowRun` audit trail.
- Webhook delivery system: subscription CRUD (secret shown once, at creation, never retrievable after), dot-delimited event-pattern matching with wildcards (`task.*`, `*.created`), HMAC-SHA256 signed delivery via BullMQ with exponential-backoff retry — the same signing pattern this codebase already *consumes* from Stripe, now also *produced* for NAVICORE's own subscribers.
- API keys: org-scoped Bearer-token auth (`Authorization: Bearer nvc_...`) wired into `PermissionGuard` and `OrgRoleGuard` as an alternative to session auth, exactly the "same guard, different strategy" design `docs/PHASE_0_ARCHITECTURE.md` §5 calls for. Keys are org-admin-equivalent (no per-workspace fine-grained scoping yet — deliberate simplification, see TECH_DEBT.md) since a key has no associated user to check `WorkspaceMember` roles against.
- `QueueModule`: single shared BullMQ/Redis connection registration for both new queues, parses `REDIS_URL` rather than assuming the library accepts a raw connection string.
- 2 new permission-matrix entries seeded (`automation:manage`, `webhooks:manage`) — `api-keys` deliberately has no workspace-RBAC entry since it's organization-scoped via `OrgRoleGuard`, not `PermissionGuard`.

### Fixed during implementation
- A real double-counting bug in `WebhookDeliveryProcessor`: a failed HTTP response was incrementing the `attempts` counter once in the success/failure branch and again in the catch block for the same actual delivery attempt. Restructured so the update happens exactly once regardless of whether the failure was an HTTP non-2xx or a network-level exception.

### Verified this pass
- `@nestjs/bullmq` (11.0.4) and `bullmq` (5.80.9) resolve on the npm registry.
- Structural sweep across all 94 `apps/api` TypeScript files (up from 72) — 2 flagged brace-imbalances, both confirmed false positives of the checker itself (a `redis://` URL literal's `//` gets misread as a line-comment start before the checker's string-stripping runs — a bug in the check script, not the code; manually verified both files are correct).
- Zero duplicate or conflicting route paths across all 27 controllers.

### Known gaps
- **Not run against a live server** — same caveat as the Phase 2-6 pass. The durable-queue design is sound on paper; it hasn't processed a real job yet.
- API keys are org-admin-equivalent, not finely scoped (no per-key workspace or permission restriction).
- Workflow conditions are flat equality only, not a real rule engine.
- `SEND_WEBHOOK` workflow actions are fire-and-forget (no retry) — intentionally distinct from the persistent `WebhookSubscription` system, which does retry.
- Plugin system foundation (the last item in Phase 7's module list) is not built — the original roadmap itself frames this as "foundation... marketplace (Phase 10+)," and this pass didn't get to even the foundation. Tracked in TODO.md.

## [Phase 8] — 2026-07-22 — Collaboration

### Added
- Schema: `Channel`, `ChannelMember`, `ChatMessage` (with a native Postgres `String[]` for resolved mentions, not server-side @-parsing — see the model comment), plus a `CHAT_MENTION` addition to the existing `NotificationType` enum. 51 models / 18 enums total, structurally validated clean.
- Real-time delivery via Server-Sent Events backed by **Redis pub/sub**, not an in-memory EventEmitter/Subject — this app is meant to run as more than one `apps/api` instance behind a load balancer (`docs/adr/004-hosting-split.md`), and an in-memory approach would silently drop delivery to clients connected to a different instance than the one that published the event. One shared subscriber connection per process (Redis's protocol requires a dedicated connection for subscribe mode), fanned out in-process via RxJS to however many SSE connections are observing each channel.
- `RealtimeController`'s single SSE endpoint merges two Redis channels per connection: workspace-wide chat messages and the caller's own personal notification stream — kept separate at the Redis layer (privacy: other members' personal notifications never touch a channel a given client subscribes to) and merged only in the RxJS pipeline.
- Channels: public (list/join freely) and private (invite-only via an explicit add-member endpoint, no public `join`) with membership tracking (`lastReadAt` present in the schema for future unread-count support, not yet exposed via an endpoint).
- Chat: mentions are resolved by the client (an @-autocomplete picks a real user id, the same pattern Slack/Discord use) rather than guessed server-side from free text, validated against actual channel membership before the message is created, and fan out to `CHAT_MENTION` notifications delivered live over the mentioned user's personal SSE stream.
- **Deliberate architectural choice, not an oversight:** chat messages do not emit a `DomainEvent` the way every other write path in this codebase does. High-frequency routine traffic through the same pipe that feeds `ActivityLog` and every workspace's Automation triggers would spam both. Chat gets its own dedicated real-time channel instead — the right-shaped mechanism for this kind of event.
- `docs/adr/005-video-integration.md`: the "video-call integration planning" item from Phase 8's module list, scoped exactly as the original roadmap frames it — a provider decision (Daily.co, evaluated against LiveKit/Zoom/Whereby on integration speed, pricing shape, and fit with NAVICORE's existing per-org Stripe billing), not an implementation. `Channel.videoRoomUrl` exists in the schema as the landing spot; nothing populates it yet — tracked as the next action item in the ADR itself.

### Verified this pass
- Structural sweep across all 106 `apps/api` TypeScript files (up from 94) — zero import-resolution errors, zero duplicate/conflicting routes across all 30 controllers.
- No new npm dependencies needed — `rxjs` (merge/filter/map operators, Subject) and `ioredis` were already in `apps/api`'s dependency tree from earlier phases.

### Known gaps
- Not run against a live server — same caveat as every phase since Milestone 1.2's live verification. The SSE/Redis pub/sub design hasn't streamed a real event to a real connected client yet.
- Private channels are enforced at the API layer (join/list), but nothing prevents a determined client from computing the workspace-wide chat Redis channel name and subscribing directly to Redis if they had raw Redis access — not a real exposure (Redis isn't exposed to clients, only to `apps/api`), but worth naming rather than leaving implicit.
- No unread-message count endpoint yet, despite `ChannelMember.lastReadAt` existing in the schema for exactly that.
- No video room creation endpoint — see ADR-005's own action items.

## [UI Correction] — 2026-07-23

**The founder corrected the visual direction before any real frontend work happened, per their explicit instruction to "note it now so nothing gets built against the old generic reference first."** The original build prompt's UI guidance ("Reference points: Linear, Vercel, Stripe, Notion") is superseded — navicore.co's own brand system is the actual direction: navy (`#080D17`) base, elevated surfaces (`#0D1B35`), gold (`#D4A843`/`#C49A2A` pressed) as a sparing accent never used as a background fill, Plus Jakarta Sans for display type, Inter for body, JetBrains Mono for KPI numbers/timestamps/IDs (not just code).

- Built `packages/ui` for real — it was referenced in the Phase 0 folder structure from the start ("design tokens... defined once in packages/ui, consumed everywhere") but never actually populated until now. `src/tokens.css` is the single source of truth; `apps/web` imports it rather than defining its own tokens.
- Documented three recurring compositional patterns from navicore.co's own site, reused rather than invented fresh: uppercase tracked eyebrow labels, big-number-plus-small-label stat blocks (primary home: the new Analytics module's KPI cards), numbered step indicators (primary homes: onboarding and the Automation workflow builder's trigger → conditions → actions sequence). Each has a real, working component in `packages/ui/src/components/`, not just a description — `design-tokens.md` documents the full rationale.
- Retrofitted the existing `apps/web` shell (built before this correction, under the old generic reference) onto the new tokens — quick, since the earlier work used the same token *names* (`--color-surface`, `--color-border`, etc.), just wrong *values*; only the cyan accent (never part of the correction) needed removing and one component reference updating.
- `docs/PHASE_0_ARCHITECTURE.md` gained a new §8.5 pointing at this correction explicitly, so a future reader of the architecture doc doesn't build against the superseded reference.

## [Phase 9] — 2026-07-23 — Analytics & Reporting

### Added
- Schema: `SavedReport` model.
- `AnalyticsService`: dashboard KPI summary (open tasks, active deals, weighted pipeline value, overdue invoices — the exact four numbers `packages/ui`'s `StatBlock` component is meant to render), deals-by-stage, tasks-by-assignee, invoice aging (standard 30/60/90-day buckets).
- Revenue forecast is a real calculation, not a placeholder: sum of each open deal's value weighted by its pipeline stage's `probability` — exactly what `PipelineStage.probability` (Phase 3) was modeled for from the start.
- Saved reports: create/list/delete/run, dispatching to the matching `AnalyticsService` method by `SavedReportType`.

### Deliberate architectural choice
`docs/PHASE_0_ARCHITECTURE.md` flags Analytics as the one place CQRS might be justified ("only where read/write patterns genuinely diverge"). This pass does **not** build a CQRS read-model — every metric is a live Prisma aggregate query. Simple enough to be fine at current scale; a materialized/projected read model is the next step only if query load becomes a measured problem, not before. See `PERFORMANCE_REVIEW.md`.

## [Phase 10] — 2026-07-23 — Enterprise & Hardening

### Added
- Schema: `ResourcePermissionOverride` (per-resource permission grants beyond a user's workspace-wide role — widens access, never narrows it), `IntegrationDefinition` + `OrganizationIntegration` (marketplace/plugin foundation, deferred here from Phase 7 per the original roadmap's own framing), plus `TaskStatus.isTerminal` (a real bug fix — see below). **55 models / 19 enums total** across both Phase 9 and 10 additions, structurally validated clean (zero relation errors, zero duplicate/conflicting routes across all 36 controllers).
- Advanced permissions: `PermissionsService.hasResourcePermission()` checks a base role grant OR a resource-specific override. Not yet wired into any existing controller's `@RequirePermission` flow — available for a service that needs it, not retrofitted everywhere. See `TECH_DEBT.md`.
- **Audit center**: found and fixed a real gap while building this — workspace member add/role-change/remove and API key create/revoke were security-sensitive actions that emitted no domain event at all in every earlier phase. Both now do. `AuditController` (`organizations/:organizationId/audit-log`) gives a filterable, org-wide view over `ActivityLog` — covering both workspace-scoped and the new org-only events in one place.
- Production hardening: global IP-based rate limiting (`@nestjs/throttler`, 100 req/60s, health check and Stripe webhook exempted via `@SkipThrottle()`) and `helmet()` security headers — both explicitly called for in the Security section of `docs/PHASE_0_ARCHITECTURE.md` since Phase 0 planning, not implemented until now.
- `docs/adr/006-sso-scim-planning.md`: SSO decision is real (`@better-auth/sso` — the natural choice given the existing all-in commitment to Better Auth, ADR-002), SCIM is explicitly left open pending verification of what Better Auth actually ships for it.
- `docs/SECURITY_REVIEW.md`, `docs/PERFORMANCE_REVIEW.md`, `docs/LAUNCH_CHECKLIST.md` — genuine static reviews of this codebase (not a live pen-test or load test, which this sandbox can't run), with real, specific findings rather than a generic checklist.

### Bug found and fixed during this pass (not by later verification — caught while writing the audit-event code)
`ApiKeysService`'s new audit-event emission originally set `workspaceId: organizationId` as a workaround for API keys having no natural workspace — this would have caused a **foreign key violation** at write time, since `ActivityLog.workspaceId` was a required FK to `Workspace`, and an organization id is never a valid workspace id. Fixed properly, not papered over: `ActivityLog.workspaceId` is now nullable (org-level events genuinely have no workspace to attach to), `DomainEvent`'s TypeScript type widened to match, and every consumer (`ActivityListener`, `AutomationTriggerListener`, `WebhookTriggerListener`, `AutomationProcessor`) checked for correct behavior with a null value — all degrade safely to a no-op for workspace-scoped lookups against a null workspace id, none crash. Swept the rest of the codebase for the same `delete()`/`update()`-with-extra-filter-field mistake pattern that caused a similar near-miss in `PermissionOverridesService`; found and fixed one instance, confirmed no others exist.

### Second bug found and fixed during the performance review
`AnalyticsService`'s "open tasks" count matched on the literal Kanban column name `"Done"` — silently wrong for any project with a customized board. Fixed structurally: `TaskStatus.isTerminal` added, `ProjectsService`'s default-column creation and `AnalyticsService`'s query both updated. Not left as a documented-but-unfixed finding — see `PERFORMANCE_REVIEW.md` #3 and `LAUNCH_CHECKLIST.md`.

### Known gaps
- Not run against a live server — same standing caveat.
- Per-organization rate limiting not implemented, only per-IP (needs a custom throttler tracker keyed by resolved org).
- `hasResourcePermission` exists but isn't consumed by any controller yet.
- SCIM is genuinely undecided, not just unimplemented — see ADR-006.
- `npm audit`/`pnpm audit` never run this session.

## [Deploy fixes] — 2026-07-24

The founder independently diagnosed a broken Railway deploy and ran a dependency audit before any of this reached a running server — root causes below, all verified rather than guessed at.

### Fixed
- **Railway build command bypassing Turborepo** — root cause of every `Cannot find module '@navicore/db'` error at deploy time. `apps/api`'s Railway service was configured with `pnpm --filter @navicore/api build`, which builds `apps/api` in isolation without first building `packages/db`/`packages/config` as this repo's own `turbo.json` `dependsOn: ["^build"]` requires. **This was a Railway dashboard setting, not a code defect** — the fix is `docs/DEPLOYMENT.md` (new), which documents the correct Build Command (`turbo run build --filter=@navicore/api`) and explains why a committed `railway.json` isn't used instead: a documented, current Railway community-reported failure mode where GitHub-triggered deploys of shared monorepos lose workspace context between build and runtime containers in a way dashboard-configured commands don't. Flagged with a source and a "verify before relying on this" note rather than silently avoided.
- `apps/api/tsconfig.json`: `"types"` array excluded `"multer"` despite `@types/multer` being installed — added.
- `apps/api/tsconfig.json`: `baseUrl: "./"` had no matching `paths` and did nothing under `nodenext` module resolution (a leftover from before the Prisma-7-driven `nodenext` migration, see the original Milestone 1.1 entry) — removed rather than suppressed.
- `apps/api/tsconfig.build.json` didn't exist, so `nest build`'s typecheck pulled in `test/health.e2e-spec.ts`, which needs Jest types not configured for the production build. Added the standard Nest pattern (`extends` the main tsconfig, excludes `test`/`dist`/`**/*spec.ts`).

### Security — dependency audit
Two active, current, high-severity advisories confirmed against a live vulnerability database (OSV) during this fix: `sharp` (GHSA-f88m-g3jw-g9cj, inherited libvips CVEs, severity 7.0) and `fast-uri` (GHSA-v2hh-gcrm-f6hx, host confusion via backslash authority delimiter, severity 7.5) — both "fix available," both confirmed to match the founder's own audit findings. `file-type`, `@hono/node-server`, and `postcss` are transitive through dev tooling (`@prisma`'s dev server, Tailwind's build pipeline) rather than shipped to production, per the founder's own audit — pinned regardless via the same override block rather than treated as separate follow-up work.
- Root `package.json` gained a `pnpm.overrides` block forcing all five packages to patched versions workspace-wide, regardless of which transitive dependency chain pulls them in.
- `sharp` added as an explicit direct dependency of `apps/web` (not just relying on the override catching it transitively) — `next/image` wants it for production image optimization, and this is also the package most directly relevant to "this app processes user-uploaded files," per the founder's own framing of why it's the one real production risk among the five.

### Added
- `docs/DEPLOYMENT.md` — Railway/Vercel/Supabase setup steps, including the build-command root cause explained in enough detail that it doesn't get reintroduced by a future dashboard change.
