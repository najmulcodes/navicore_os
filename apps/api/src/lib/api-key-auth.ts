import { createHash } from "node:crypto";
import type { Request } from "express";
import { prisma } from "@navicore/db";

export const API_KEY_PREFIX = "nvc_";

export interface ApiKeyAuthResult {
  organizationId: string;
  apiKeyId: string;
}

/**
 * API keys are org-scoped, not tied to a specific user (see the ApiKey
 * model's comment in prisma/schema.prisma) — there's no natural "acting
 * user" to check workspace-level Role/Permission against the way a session
 * has. A key authenticates as org-admin-equivalent: it can act on any
 * workspace within its organization, without a fine-grained per-workspace
 * role. This is a deliberate simplification for the first pass — see
 * TECH_DEBT.md for what real per-key scoping would need.
 */
export async function resolveApiKey(request: Request): Promise<ApiKeyAuthResult | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ") ) return null;

  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey.startsWith(API_KEY_PREFIX)) return null;

  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { hashedKey } });

  if (!apiKey || apiKey.revokedAt) return null;

  // Best-effort — a failed write here shouldn't block the actual request.
  void prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { organizationId: apiKey.organizationId, apiKeyId: apiKey.id };
}
