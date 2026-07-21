import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@navicore/db";
import { API_KEY_PREFIX } from "../../lib/api-key-auth";
import { CreateApiKeyDto } from "./dto/api-key.dto";

@Injectable()
export class ApiKeysService {
  constructor(private readonly events: EventEmitter2) {}

  async create(organizationId: string, dto: CreateApiKeyDto, actorId: string) {
    const rawKey = `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId,
        name: dto.name,
        hashedKey,
        keyPrefix: rawKey.slice(0, 12),
        createdById: actorId,
      },
    });

    // Audit-relevant (Phase 10) — API key creation is security-sensitive.
    // workspaceId is null: API keys are org-scoped, not workspace-scoped,
    // and ActivityLog.workspaceId is nullable specifically to accommodate
    // events like this one. See ActivityLog's schema comment.
    this.events.emit("api_key.created", {
      organizationId,
      workspaceId: null,
      actorId,
      entityType: "api_key",
      entityId: apiKey.id,
      action: "created",
      metadata: { name: dto.name, keyPrefix: apiKey.keyPrefix },
    });

    // The only response that ever includes the raw key — it's not
    // recoverable after this (only the hash is stored). Same pattern as
    // WebhooksService.create for the same reason.
    return { id: apiKey.id, name: apiKey.name, key: rawKey, keyPrefix: apiKey.keyPrefix };
  }

  findAll(organizationId: string) {
    return prisma.apiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(organizationId: string, apiKeyId: string, actorId: string) {
    const existing = await prisma.apiKey.findFirst({ where: { id: apiKeyId, organizationId } });
    if (!existing) throw new NotFoundException("API key not found");

    const revoked = await prisma.apiKey.update({ where: { id: apiKeyId }, data: { revokedAt: new Date() } });

    this.events.emit("api_key.revoked", {
      organizationId,
      workspaceId: null,
      actorId,
      entityType: "api_key",
      entityId: apiKeyId,
      action: "revoked",
      metadata: { name: existing.name, keyPrefix: existing.keyPrefix },
    });

    return revoked;
  }
}
