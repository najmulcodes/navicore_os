# ADR-006: SSO & SCIM — Planning (Phase 10)

**Status:** Accepted (SSO decision) / Open (SCIM — see below)
**Date:** 2026-07-23
**Deciders:** Founder/CTO

## Context

Phase 10's module list: "SSO, SCIM planning." Like ADR-005 (video), this is planning-scoped, not an implementation — nothing in this ADR is wired into `auth.ts` yet.

## Decision (SSO)

**`@better-auth/sso`** — the official Better Auth SSO plugin, not a separate identity provider or a hand-rolled SAML/OIDC implementation.

## Rationale

This isn't really a multi-option evaluation the way ADR-001 through ADR-005 were — having already committed to Better Auth for the entire auth layer (ADR-002), a separate SSO provider (e.g., WorkOS, a standalone SAML library) would mean running two authentication systems side by side, with all the session/user-identity reconciliation problems that creates. `@better-auth/sso` is built by the same team on the same core, and its shape fits this product's multi-tenant structure directly: `registerSSOProvider` takes an `organizationId`, meaning each NAVICORE customer organization can register its own IdP (Okta, Azure AD, Google Workspace, etc.) independently — exactly the "one org, one IdP" model enterprise buyers expect, with automatic user provisioning and domain-based account linking handled by the plugin rather than custom code.

Supports both OIDC and SAML 2.0, covering the two protocols enterprise IdPs actually use.

## Consequences

- **Not done by this ADR:** installing `@better-auth/sso`, adding it to `auth.ts`'s `plugins` array, the `registerSSOProvider` admin flow (likely an Organizations-module addition — "connect your IdP" in org settings), any UI.
- The plugin manages its own schema additions (SSO provider records) via its own migration — reconcile against the hand-authored Better Auth tables the same way ADR-002's Action Item 1 already calls for.

## Decision (SCIM) — left open

Better Auth's own marketing copy claims "SSO, SAML 2.0, SCIM, and directory sync" as enterprise-ready, but this session did not independently verify a `@better-auth/scim`-equivalent package the way SSO was verified (a real, documented, versioned plugin with a clear API). **Don't treat SCIM as decided** — confirm what Better Auth actually ships for provisioning/deprovisioning via SCIM before committing to it as the implementation path. If Better Auth doesn't have a mature SCIM story by the time this is actually built, the fallback is a hand-rolled SCIM 2.0 endpoint (`/scim/v2/Users`, `/scim/v2/Groups`) mapping onto the existing `Member`/`WorkspaceMember` models — more work, but a well-trodden spec or with several open-source starting points.

## Action Items

1. [ ] Verify Better Auth's actual current SCIM offering (or lack thereof) before committing further
2. [ ] Install `@better-auth/sso`, wire into `auth.ts`
3. [ ] Build the "connect your IdP" admin flow (likely `OrganizationsModule`)
4. [ ] Reconcile the plugin's own schema additions against the hand-authored Better Auth tables (same as ADR-002's Action Item 1)
