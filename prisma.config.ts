// Prisma 7 moved connection configuration out of schema.prisma's `datasource`
// block and into this file — the CLI rejects a schema that still defines `url`
// (see docs/adr/003-orm-and-database.md and the Prisma 7 upgrade guide).
//
// The url below is DIRECT_URL, not DATABASE_URL: this is the connection the
// Prisma CLI uses for `migrate`/`db push`/`studio`, and Supabase's Supavisor
// pooler (what DATABASE_URL points to in staging/production) doesn't reliably
// support the DDL Prisma Migrate needs. The application's own PrismaClient
// (packages/db/src/index.ts) is configured separately with a driver adapter
// pointed at the pooled DATABASE_URL — that split is intentional, not a typo.
// See docs/adr/004-hosting-split.md, Action Item 3.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
