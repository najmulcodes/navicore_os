import { z } from "zod";

/**
 * Single source of truth for environment variables across every Node process
 * in the monorepo (apps/api today; apps/web and apps/ai-service consume the
 * relevant subset as their own milestones land). Validated once, at boot —
 * per docs/PHASE_0_ARCHITECTURE.md §8 ("the app fails fast on missing/invalid
 * config instead of failing on first use").
 *
 * Scope note: only variables actually consumed by code that exists are
 * required here — a required env var nothing reads yet is more confusing
 * than helpful. Grows alongside the modules that need new config.
 */

const postgresConnectionString = z
  .string()
  .min(1, { error: "must not be empty" })
  .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
    error: "must be a postgresql:// or postgres:// connection string",
  });

const redisConnectionString = z
  .string()
  .min(1, { error: "must not be empty" })
  .refine((value) => value.startsWith("redis://") || value.startsWith("rediss://"), {
    error: "must be a redis:// or rediss:// connection string",
  });

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Prisma 7 + Supabase Supavisor: pooled (app runtime) vs. direct (migrations).
  // See docs/adr/004-hosting-split.md, Action Item 3.
  DATABASE_URL: postgresConnectionString,
  DIRECT_URL: postgresConnectionString,

  REDIS_URL: redisConnectionString,

  API_PORT: z.coerce.number().int().positive().default(3001),

  // --- Better Auth (Milestone 1.2) --------------------------------------
  // See apps/api/src/lib/auth.ts and docs/adr/002-auth-provider.md.
  BETTER_AUTH_SECRET: z.string().min(32, {
    error: "must be at least 32 characters — generate with `openssl rand -base64 32`",
  }),
  BETTER_AUTH_URL: z
    .string()
    .min(1)
    .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
      error: "must be a full URL including scheme (e.g. http://localhost:3001)",
    }),
  // apps/web's own origin — Better Auth needs this in trustedOrigins or every
  // cross-origin auth request gets rejected with MISSING_OR_NULL_ORIGIN.
  WEB_APP_URL: z
    .string()
    .min(1)
    .default("http://localhost:3000")
    .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
      error: "must be a full URL including scheme",
    }),
  // OAuth providers are optional — email/password works with neither
  // configured. Both client id and secret must be set together per provider;
  // that pairing is enforced by superRefine below, not by the field types.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // --- Supabase Storage (Phase 2 Attachments, Phase 4 File manager) ------
  // Optional at boot — StorageService throws a clear error on first use if
  // unset, rather than every environment being forced to configure Storage
  // just to run unrelated modules. See apps/api/src/lib/storage.service.ts.
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // --- Stripe (Phase 5 billing) -------------------------------------------
  // Same optionality reasoning as Supabase above.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // --- AI Layer (Phase 6) --------------------------------------------------
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  INTERNAL_AI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const envSchema = baseEnvSchema.superRefine((env, ctx) => {
  const pairs: Array<[string, unknown, string, unknown]> = [
    ["GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_SECRET", env.GOOGLE_CLIENT_SECRET],
    ["GITHUB_CLIENT_ID", env.GITHUB_CLIENT_ID, "GITHUB_CLIENT_SECRET", env.GITHUB_CLIENT_SECRET],
  ];

  for (const [idKey, idVal, secretKey, secretVal] of pairs) {
    if (Boolean(idVal) !== Boolean(secretVal)) {
      ctx.addIssue({
        code: "custom",
        message: `${idKey} and ${secretKey} must be set together, or both left unset`,
        path: [idVal ? secretKey : idKey],
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates `process.env`, throwing a single readable error listing
 * every problem found (not just the first) if validation fails. Call this once
 * at process startup — e.g. the top of apps/api's main.ts — not per-request.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment configuration. Check .env against .env.example.\n${issues}`,
    );
  }

  return result.data;
}
