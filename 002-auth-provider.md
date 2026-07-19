# ADR-002: Auth Provider — Better Auth

**Status:** Proposed
**Date:** 2026-07-18
**Deciders:** Founder/CTO

## Context

Phase 1 needs email/password, OAuth, and MFA/passkeys, plus native multi-tenancy (organizations, members, invitations, roles) — Work Management and CRM in Phases 2–3 are meaningless without a working org/workspace/RBAC layer under them. Hand-rolling multi-tenant auth is a well-known way to burn months building something a library already does correctly, and getting session/credential handling wrong is a security-critical mistake, not a stylistic one.

## Decision

Better Auth, using its organization plugin for org/member/invitation primitives, extended with NAVICORE's own `Workspace` and fine-grained `Role`/`Permission` tables (see `prisma/schema.prisma`) for the concepts Better Auth's plugin doesn't cover.

## Options Considered

### Option A: Better Auth
| Dimension | Assessment |
|---|---|
| Complexity | Low-Medium — TypeScript-native, runs inside the NestJS/Next stack directly, no separate service to run |
| Cost | Free, self-hosted, no per-MAU pricing |
| Scalability | Good — it's a library, not a hosted service, so it scales with the app's own infra |
| Team familiarity | New to the team, but TypeScript-native and well-documented |

**Pros:** organization plugin gives orgs/members/invitations/roles out of the box; no vendor lock-in or per-user pricing; data stays in NAVICORE's own Postgres instead of a third-party auth database; passkeys/MFA supported as plugins.
**Cons:** younger project than Auth0/Clerk, smaller community to lean on if something unusual comes up; workspace-level (sub-org) membership and fine-grained per-module permissions are NAVICORE-owned code layered on top, not something the plugin hands over for free — explicitly called out as a build item, not an assumption, in the original stack notes.

### Option B: Clerk
| Dimension | Assessment |
|---|---|
| Complexity | Low — hosted, drop-in components |
| Cost | Per-MAU pricing, meaningful at scale |
| Scalability | High, it's their problem not ours |
| Team familiarity | Low |

**Pros:** fastest to a working login screen, polished pre-built UI components.
**Cons:** per-MAU cost that scales against the business model of a multi-tenant B2B tool (cost grows with exactly the metric that means the product is succeeding); user data lives in Clerk's system, not NAVICORE's own Postgres, which complicates cross-referencing users with `ActivityLog`/RBAC without extra sync work.

### Option C: Auth0
**Pros:** enterprise-proven, SSO/SCIM story is strong for Phase 10.
**Cons:** heavier to configure for a product this early, per-MAU/feature-gated pricing, another external dependency for something as core as session handling. SSO/SCIM need is real but it's a Phase 10 concern, not a Phase 1 one.

### Option D: NextAuth / Auth.js
**Pros:** free, popular, tightly integrated with Next.js.
**Cons:** primarily session/OAuth-focused — organization/multi-tenancy, MFA, and passkeys are not first-class the way Better Auth's plugin ecosystem makes them; would mean building the org/RBAC layer from a thinner starting point.

### Option E: Hand-rolled
**Cons only, no serious pros here:** reinvents session handling, password hashing, OAuth state/PKCE, MFA, and multi-tenant data modeling — all security-critical, all already solved. Not defensible for a product with this scope.

## Trade-off Analysis

The real trade-off is Better Auth vs. Clerk: build-time speed (Clerk) vs. long-term cost shape and data ownership (Better Auth). Given NAVICORE OS is explicitly a multi-tenant B2B product where "more organizations, more members" is the growth metric, a per-MAU auth bill is a tax on success. Better Auth costs more integration time now in exchange for owning the data model that Phase 8 (Admin & Security, audit logs, complex org hierarchies) needs direct access to anyway.

## Consequences

- Easier: no per-user auth billing, full control over the `User`/`Organization`/`Member` data for audit logging and RBAC joins, MFA/passkeys available as plugins without a separate vendor integration.
- Harder: NAVICORE owns building/maintaining the `Workspace` (sub-org) concept and the fine-grained `Role`/`Permission` tables — Better Auth's org plugin gives coarse org-level roles, not the module-level permission matrix in Section 4 of the architecture doc.
- Revisit trigger: if SSO/SCIM (Phase 10, enterprise buyers) turns out to need more than Better Auth's plugin ecosystem supports by the time Phase 10 starts.

## Action Items

1. [ ] Run Better Auth's schema generator in Phase 1 and reconcile its output against `prisma/schema.prisma`'s `Workspace`/`Role`/`Permission` models — see `TECH_DEBT.md` #3
2. [ ] Confirm current Better Auth major version and organization-plugin API surface before Phase 1 scaffolding (this stack moves fast; verify rather than assume)
