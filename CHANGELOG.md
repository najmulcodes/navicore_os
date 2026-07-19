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
