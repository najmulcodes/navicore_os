# @navicore/db

Thin wrapper around Prisma 7's generated client, so the rest of the monorepo
imports a normal workspace package (`@navicore/db`) instead of reaching into a
generated-code folder with relative paths.

## Why this package exists (flagged deviation from Phase 0)

`docs/PHASE_0_ARCHITECTURE.md` §6's approved folder structure listed only
`packages/ui`, `packages/types`, and `packages/config`. This package is an
addition made during Phase 1 Milestone 1.1, not something the founder signed
off on by name — flagged here rather than silently expanding scope.

The reason it exists: Prisma 7 requires an explicit `output` path for the
generated client (see `docs/adr/003-orm-and-database.md`'s Milestone 1.1
correction) and requires the application to construct the client itself with
a driver adapter — there's no more implicit `new PrismaClient()` that just
works. Routing that output into its own package, with one file that does the
adapter/pool setup once, means:

- `apps/api` (and later `apps/ai-service` calling into it, or a future worker
  process) all import `@navicore/db` and get the same configured singleton,
  instead of each re-implementing driver-adapter setup.
- The generated code (`src/generated/`, gitignored — see root `.gitignore`)
  has exactly one place it's imported from directly (`src/index.ts`), so if
  Prisma's generator output shape changes again, one file changes. It lives
  under `src/`, not as a sibling of it — has to, for this package's own
  `tsconfig.json` (`rootDir: "src"`) to include it in compilation. This was
  wrong in an earlier version (output landed outside `rootDir`, silently
  broke the build) — fixed 2026-07-24.

## Usage

```ts
import { prisma } from "@navicore/db";

const org = await prisma.organization.findUnique({ where: { id } });
```

`prisma` is a lazily-created singleton (see `src/index.ts`) backed by
`@prisma/adapter-pg` against `DATABASE_URL` — the **pooled** Supavisor
connection in staging/production, plain local Postgres in dev. It is not the
same connection Prisma Migrate uses; see `prisma.config.ts` at the repo root
and `docs/adr/004-hosting-split.md` Action Item 3.

## Regenerating the client

```bash
pnpm db:generate   # run from repo root after any prisma/schema.prisma change
```
