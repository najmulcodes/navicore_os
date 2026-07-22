# Deployment

Three vendors, each doing a different job — see `docs/adr/004-hosting-split.md` for the full reasoning. This doc is the practical setup steps; the ADR is the "why."

| Vendor | What goes there |
|---|---|
| **Vercel** | `apps/web` only |
| **Railway** | `apps/api`, `apps/ai-service`, and Redis |
| **Supabase** | Postgres (pgvector-enabled) and Storage |

## Railway — shared monorepo setup

This repo is a **shared monorepo** in Railway's terminology (a single `pnpm-workspace.yaml` with cross-package dependencies — `apps/api` depends on `packages/db` and `packages/config`), not an isolated one. Per Railway's own docs, that means:

- **Do not set a Root Directory** on the `apps/api` or `apps/ai-service` services. Root Directory is for isolated monorepos where each component is self-contained; setting it here breaks `apps/api`'s ability to see `packages/db`/`packages/config` during build.
- Instead, set a **custom Build Command** per service that runs from the true repo root.

### `apps/api` service settings

- **Build Command:** `turbo run build --filter=@navicore/api`
- **Start Command:** `node apps/api/dist/main.js`

**Root cause of the "Cannot find module '@navicore/db'" failure mode, if you hit it:** a Build Command of just `pnpm --filter @navicore/api build` bypasses Turborepo's task graph entirely — it builds `apps/api` in isolation without first building `packages/db`/`packages/config`, which `apps/api` imports at runtime as compiled workspace packages, not source. `turbo run build --filter=@navicore/api` builds the whole dependency chain in the right order (that's what `turbo.json`'s `dependsOn: ["^build"]` is for) before building `apps/api` itself. The root `package.json`'s own `turbo.json` pipeline was already correct — this is purely a Railway service-settings issue, not something a code change fixes.

### `apps/ai-service` service settings

Python, not part of the Turborepo graph — no build-command gotcha here.
- **Build Command:** (leave default — Railway's Nixpacks builder detects `requirements.txt` automatically) or point it at the `Dockerfile` in that directory
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### On committing a `railway.json` instead of using dashboard settings

Railway supports codifying build/start commands in a committed `railway.json`/`railway.toml` rather than a dashboard setting that's easy to forget or accidentally revert. That's generally the better practice — **except** there's a documented, current (reported as recently as Oct 2025 on Railway's own community forum) failure mode specific to shared monorepos deployed via GitHub integration: the build container has access to the full workspace context (`pnpm-workspace.yaml`, sibling packages), but the runtime container has been reported to lose that context, in a way a `railway up` CLI deploy doesn't reproduce. The one documented workaround was reverting to dashboard configuration. **This repo doesn't ship a `railway.json` for that reason** — the dashboard Build/Start Command fields above are the source of truth until that's independently verified against this specific setup. If you want to try codifying it anyway, test a GitHub-triggered deploy specifically (not just `railway up`) before relying on it.

### Redis

Railway-managed, same project as `apps/api`/`apps/ai-service` for private networking — use the internal connection string for `REDIS_URL`, not the public one (lower latency, doesn't route BullMQ traffic over the public internet).

## Supabase

- Enable the `pgvector` extension (Phase 4 needs it — see `docs/adr/003-orm-and-database.md`).
- Two connection strings needed in every environment: `DATABASE_URL` (pooled, via Supavisor, `?pgbouncer=true`) for app runtime, `DIRECT_URL` (unpooled) for Prisma Migrate. See `.env.example` and `docs/adr/004-hosting-split.md` Action Item 3 — Prisma Migrate doesn't reliably work through the pooler.
- Storage: create the `navicore-files` bucket (see `apps/api/src/lib/storage.service.ts`'s `BUCKET` constant) before any upload endpoint will work.

## Vercel

- `apps/web` only. Root Directory: `apps/web`.
- Needs `NEXT_PUBLIC_API_URL` (or equivalent) pointed at `apps/api`'s Railway public URL — not yet added to this codebase, since `apps/web` hasn't been built past the shell (`TECH_DEBT.md` #16). Add it when real data fetching gets wired up.
- Vercel's own image optimization infrastructure typically handles `next/image` without needing `sharp` explicitly, but it's listed as a direct dependency in `apps/web/package.json` anyway (pinned to the patched version — see the dependency-audit note in `CHANGELOG.md`) so local dev and any non-Vercel deployment target both work correctly too.

## Environment variables checklist

Every env var referenced across `.env.example` (root) and `apps/ai-service/.env.example` needs setting in the corresponding Railway/Vercel service's environment — `.env` files are gitignored and never deployed; each platform needs these set through its own dashboard/CLI.
