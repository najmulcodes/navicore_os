# NAVICORE OS

AI-first Business Operating System — project management, CRM, finance, knowledge management, automation, and collaboration in one platform.

**Current status: Phases 0-6 built.** Core Platform (auth/RBAC/workspaces), Work Management, CRM & Sales, Knowledge & Documents, Finance & Billing, and the AI Layer all have real, working code against a 42-model schema. **None of it has run against a live server yet** — see "Before you run anything" below and `TODO.md`'s Immediate section. Phases 7-10 (Automation, Collaboration, Analytics, Enterprise) are not started.

## Before you run anything

```bash
corepack enable
pnpm install
cp .env.example .env                    # fill in BETTER_AUTH_SECRET at minimum (openssl rand -base64 32)
docker compose up -d                     # local Postgres (pgvector-ready) + Redis
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed                             # seeds the full RBAC permission matrix + a demo org/workspace
pnpm dev                                 # or: pnpm --filter @navicore/api dev
curl localhost:3001/health               # should return {"status":"ok",...}
```

To actually use auth/CRM/etc. beyond the health check: sign up via `POST /api/auth/sign-up/email`, then `SEED_DEMO_USER_EMAIL=you@example.com pnpm db:seed` to attach yourself to the demo workspace as Owner.

Optional, module-specific (each fails clearly, not silently, if unset and you hit that endpoint):
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — file uploads (Attachments, File manager)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — platform billing
- `ANTHROPIC_API_KEY` (in `apps/ai-service/.env`) + `INTERNAL_AI_API_KEY` (both sides) — AI Assistant

**Read `TODO.md`'s "Immediate" section and `TECH_DEBT.md` #9-#13 before trusting this in front of a real user** — this was built at speed across many phases in one pass; every correction along the way came from registry/doc verification and static analysis, not execution against a live server.

## What's in here

| Path | What it is |
|---|---|
| `docs/PHASE_0_ARCHITECTURE.md`, `docs/adr/` | Architecture, ADRs (all Accepted) |
| `prisma/schema.prisma` | 42 models / 15 enums — Better Auth tables, RBAC, and all of Phases 2-6 |
| `packages/config` | Fail-fast Zod env schema |
| `packages/db` | Prisma 7 client singleton (driver adapter, pooled connection) |
| `apps/api` | NestJS 11 — auth, RBAC, and every domain module (see `src/modules/`) |
| `apps/ai-service` | FastAPI — provider-agnostic AI routing, `/chat`, `/summarize` |
| `apps/web` | Next.js 16 — shell only (sidebar, command palette, one page) |
| `CHANGELOG.md` | What shipped, including every correction made along the way |
| `TODO.md` | What's next — start with the Immediate section |
| `TECH_DEBT.md` | Scored, prioritized — #9 through #13 are the ones to read first |

## Next step

Verify live (see above), then either build out `apps/web` into a real frontend, or continue to Phase 7 (Automation & Integrations). See `TODO.md`.
