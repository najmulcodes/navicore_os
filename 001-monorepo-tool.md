# ADR-001: Monorepo Tool — Turborepo + pnpm Workspaces

**Status:** Proposed
**Date:** 2026-07-18
**Deciders:** Founder/CTO

## Context

NAVICORE OS spans multiple deployables from day one (`apps/web`, `apps/api`, `apps/ai-service` from Phase 6) plus shared packages (`packages/ui`, `packages/types`, `packages/config`) that need to stay in lockstep — a permission key added in `packages/types` has to be usable by both `apps/web` and `apps/api` in the same commit. Polyrepo would make that an out-of-band coordination problem; a single repo with a real build/task orchestrator avoids it.

## Decision

Turborepo + pnpm workspaces.

## Options Considered

### Option A: Turborepo + pnpm workspaces
| Dimension | Assessment |
|---|---|
| Complexity | Low — pnpm workspaces handle linking, Turborepo adds caching/task graph on top |
| Cost | Free (local), remote cache optional later |
| Scalability | Handles the current app count comfortably; scales to dozens of packages |
| Team familiarity | High — widely documented, same ecosystem as Next.js/Vercel |

**Pros:** minimal config, incremental/remote build caching, native Vercel integration for `apps/web`, doesn't force a plugin/generator model on the team.
**Cons:** less opinionated than Nx — team has to enforce its own conventions for module boundaries rather than getting them enforced by tooling.

### Option B: Nx
| Dimension | Assessment |
|---|---|
| Complexity | Medium-High — more powerful, more to learn |
| Cost | Free core, paid Nx Cloud for full remote caching at scale |
| Scalability | Excellent, including enforced module-boundary rules via `nx.json` tags |
| Team familiarity | Lower — steeper learning curve, more opinionated generators |

**Pros:** can enforce "module X may not import module Y" at the tooling level, not just by convention — directly relevant to the "modules never share a database connection" rule in `docs/PHASE_0_ARCHITECTURE.md`.
**Cons:** heavier to adopt, generator-driven workflow is more opinionated than the team needs at this size, less natural fit with a plain Next.js + NestJS stack that doesn't need Nx's framework plugins.

### Option C: Plain pnpm workspaces, no task orchestrator
**Pros:** zero extra tooling.
**Cons:** no build caching, no task graph — every CI run rebuilds everything, which gets slow fast once `apps/ai-service` and more packages exist. Not worth the savings.

### Option D: Polyrepo (separate repos per app)
**Pros:** clean deploy boundaries per repo.
**Cons:** shared types/config either get published as versioned packages (real overhead for a pre-PMF team) or duplicated (drift risk). Directly works against the "single accountable state, not scattered chat history" principle this whole build process is built on.

## Trade-off Analysis

The real choice is Turborepo vs. Nx. Nx's enforced-boundary feature is genuinely attractive given how much this project leans on "modules talk through public services, never direct DB access" — but that rule is currently enforced by code review and the guard described in Section 2 of the architecture doc, which is enough at team size 1. Nx's overhead (generators, its own mental model on top of Next.js/NestJS) isn't worth paying for before there's a team large enough for convention-only enforcement to start slipping.

## Consequences

- Easier: incremental builds/tests in CI, adding new packages, Vercel deploys for `apps/web`.
- Harder: nothing is enforced against accidental cross-module imports at the tooling level — that's still a code-review discipline, not a lint rule, until/unless this gets revisited.
- Revisit trigger: if module-boundary violations start actually happening in review, that's the signal to add an ESLint import-boundary rule (cheaper first step) before considering a move to Nx.

## Action Items

1. [ ] Scaffold `pnpm-workspace.yaml` + `turbo.json` in Phase 1
2. [ ] Add an ESLint rule restricting imports across `apps/api/src/modules/*` to only each module's exported `index.ts`, once there's more than one module to violate the rule
