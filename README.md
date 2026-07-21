# NAVICORE OS

AI-first Business Operating System — project management, CRM, finance, knowledge management, automation, and collaboration in one platform.

**Current status: all ten phases of the original roadmap are built.** Core Platform (auth/RBAC/workspaces), Work Management, CRM & Sales, Knowledge & Documents, Finance & Billing, AI Layer, Automation & Integrations, Collaboration, Analytics & Reporting, and Enterprise & Hardening all have real, working code against a 55-model schema. **Most of it has not run against a live server** — see `docs/LAUNCH_CHECKLIST.md`, which is the actual authoritative "what's safe to trust vs. what needs verification" document, built by consolidating every finding across all ten phases. Read that before `apps/web` or anything else.

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
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — file uploads
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — platform billing
- `ANTHROPIC_API_KEY` (in `apps/ai-service/.env`) + `INTERNAL_AI_API_KEY` (both sides) — AI Assistant

## What's in here

| Path | What it is |
|---|---|
| `docs/PHASE_0_ARCHITECTURE.md`, `docs/adr/` | Architecture, ADRs (6, all Accepted except SCIM's open decision in ADR-006) |
| `docs/LAUNCH_CHECKLIST.md` | **Start here.** Consolidated, ordered list of what to verify/fix before real users |
| `docs/SECURITY_REVIEW.md`, `docs/PERFORMANCE_REVIEW.md` | Genuine static reviews with specific findings, not generic checklists |
| `prisma/schema.prisma` | 55 models / 19 enums — every phase's data model |
| `packages/ui` | Design tokens (navicore.co's actual brand — see `design-tokens.md`) + reference components |
| `packages/config`, `packages/db` | Shared env validation, Prisma client |
| `apps/api` | NestJS 11 — every module across all ten phases (see `src/modules/`) |
| `apps/ai-service` | FastAPI — provider-agnostic AI routing, `/chat`, `/summarize` |
| `apps/web` | Next.js 16 — shell only, now on the corrected brand tokens |
| `CHANGELOG.md` | Full history, including every correction and bug found along the way |
| `TODO.md` | Working backlog — `LAUNCH_CHECKLIST.md` is the filtered, ordered version |
| `TECH_DEBT.md` | Every tracked gap, scored by impact × risk against effort |

## Next step

Work through `docs/LAUNCH_CHECKLIST.md` in order. The blocking items are genuinely blocking (specific failure modes, not vague caution); everything else is scored and sequenced.
