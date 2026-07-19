import { z } from "zod";

/**
 * Single source of truth for environment variables across every Node process
 * in the monorepo (apps/api today; apps/web and apps/ai-service consume the
 * relevant subset as their own milestones land). Validated once, at boot —
 * per docs/PHASE_0_ARCHITECTURE.md §8 ("the app fails fast on missing/invalid
 * config instead of failing on first use").
 *
 * Scope note: only variables actually consumed by Milestone 1.1 code are
 * required here (DB + Redis connectivity, API port). Better Auth's secrets
 * and OAuth client IDs are added in Milestone 1.2 alongside the code that
 * reads them — a required env var nothing reads yet is more confusing than
 * helpful.
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

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Prisma 7 + Supabase Supavisor: pooled (app runtime) vs. direct (migrations).
  // See docs/adr/004-hosting-split.md, Action Item 3.
  DATABASE_URL: postgresConnectionString,
  DIRECT_URL: postgresConnectionString,

  REDIS_URL: redisConnectionString,

  API_PORT: z.coerce.number().int().positive().default(3001),
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
