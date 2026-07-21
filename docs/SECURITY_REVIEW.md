# Security Review — Phase 10

**What this is:** a static review of this codebase, done by reading the code — not a penetration test. Nothing here was verified by actually attacking a running instance; this environment can't run one. Treat this as "what a careful reading found," not "certified secure."

**Date:** 2026-07-23

## Findings

### 1. File uploads have no MIME-type restriction — real gap
`AttachmentsController` and `FilesController` both cap upload size (`MAX_UPLOAD_BYTES = 25MB`) via Multer but accept any file type. A user could upload an HTML file with embedded script, an executable, or any other file type to Supabase Storage. The actual risk depends on how uploaded files get served back — `StorageService.getSignedDownloadUrl` returns signed URLs rather than serving files directly through `apps/api`, which limits (but doesn't eliminate — depends on `Content-Type` handling at the Supabase Storage layer and whatever eventually renders these files in `apps/web`) stored-XSS-via-upload risk. **Fix:** an explicit MIME-type allowlist in both `FileInterceptor` configs before this ships. Tracked in TECH_DEBT.md.

### 2. Raw SQL usage — checked, safe
Only two `$queryRaw` call sites in the entire codebase (`prisma-health.indicator.ts`'s `SELECT 1`, `knowledge.service.ts`'s full-text search). Both use Prisma's tagged-template syntax, which parameterizes interpolated values rather than concatenating strings — not vulnerable to SQL injection as written. Worth re-confirming this stays true if either query is ever refactored to build SQL strings by hand instead of the tagged-template form.

### 3. Authorization — every workspace/org route checked, all guarded
Verified programmatically (not just by inspection) that every controller under a `workspaces/:workspaceId/*` or `organizations/:organizationId/*` path has `@UseGuards(PermissionGuard)` or `@UseGuards(OrgRoleGuard)` applied. No route was found serving workspace- or org-scoped data without an auth guard.

### 4. API key hashing — correct as implemented
Keys are SHA-256 hashed before storage (`ApiKeysService`), not stored in plaintext, and the raw key is only ever returned once, at creation. SHA-256 (not bcrypt/scrypt) is the right choice here specifically because API keys are high-entropy random tokens (24 bytes from `randomBytes`), not user-chosen passwords — brute-forcing a random 192-bit value is infeasible regardless of hash speed, so a slow KDF would add cost without adding real protection. This would be the wrong call for password storage (Better Auth handles that separately, with its own appropriate hashing) but is correct here.

### 5. Webhook signing — correct in both directions
Outgoing webhook deliveries (`WebhookDeliveryProcessor`) are HMAC-SHA256 signed against a per-subscription secret. Incoming Stripe webhooks (`BillingService.handleWebhook`) use Stripe's own `constructEvent` signature verification against the raw request body — independently verified live (see CHANGELOG's Phase 7 entry).

### 6. Secrets — no hardcoded values found, independently verified
Confirmed (by the founder, live) — no hardcoded secrets. Every credential (`BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_AI_API_KEY`) is read from environment variables, validated at boot (Node side) or on first use (module-specific optional vars).

### 7. Rate limiting and security headers — added this pass
Neither existed before Phase 10 despite being called out in `docs/PHASE_0_ARCHITECTURE.md`'s Security section from the start. Global IP-based rate limiting (`@nestjs/throttler`, 100 req/60s) and `helmet()` security headers are now wired into `main.ts`. Per-organization rate limiting (also called for in that same section) is not implemented — it needs a custom throttler tracker keyed by the resolved session/API key's organization, not just IP. See TECH_DEBT.md.

### 8. CSRF — handled by Better Auth, not independently re-verified
Better Auth's own CSRF protection (`trustedOrigins`) is configured but relies on the broader Better Auth integration being correct, which — beyond the specific sign-up flow already verified live — hasn't been comprehensively tested against a running server.

## Not covered by this review

- Dependency vulnerability scanning (`npm audit` / `pnpm audit`) — not run this session
- Anything requiring a live server: actual auth bypass attempts, actual rate-limit behavior under load, actual CSP header inspection
- `apps/web` — this review is `apps/api` only; a real frontend security pass (XSS via user-generated content rendering, e.g. chat messages or knowledge articles) is needed once `apps/web` moves past the shell (TECH_DEBT.md #16)
