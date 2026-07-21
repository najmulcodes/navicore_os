import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, twoFactor } from "better-auth/plugins";
import { prisma } from "@navicore/db";
import { loadEnv } from "@navicore/config";

const env = loadEnv();

// OAuth providers are opt-in: only registered if both id and secret are set
// (packages/config's superRefine already guarantees they're paired, never
// half-configured). socialProviders is built conditionally rather than
// passed unconditionally with `!`-asserted possibly-undefined values.
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

/**
 * Passkey/WebAuthn support (mentioned in the original stack notes alongside
 * MFA) is deliberately NOT wired here — the Phase 1 roadmap bullet says
 * "email + OAuth + MFA", and passkey() needs an rpID/rpName pair that's
 * genuinely per-deployment (can't have a sensible default the way OAuth's
 * "just leave it unset" can). Tracked in TECH_DEBT.md rather than guessed at.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // Without this, every request from apps/web fails auth with
  // MISSING_OR_NULL_ORIGIN — Better Auth's CSRF protection is on by default.
  trustedOrigins: [env.WEB_APP_URL, env.BETTER_AUTH_URL],

  emailAndPassword: {
    enabled: true,
    // Sending real verification emails is Milestone 1.2+ follow-up work —
    // navicore.co's email is on Zoho Mail (not Resend — corrected 2026-07-20,
    // an earlier comment here had this wrong), but wiring a transactional
    // sender into Better Auth's email hooks is not done here either way.
    // Tracked in TECH_DEBT.md.
    requireEmailVerification: false,
  },

  socialProviders,

  plugins: [
    // Gives us Organization/Member/Invitation — see docs/adr/002-auth-provider.md
    // for why Workspace (a level below Organization) is NAVICORE's own model,
    // not part of this plugin.
    organization(),
    // TOTP-based MFA. WebAuthn/passkey is the other half of "MFA via Better
    // Auth" in the original stack notes — see the note above.
    twoFactor(),
  ],
});

export type Auth = typeof auth;
