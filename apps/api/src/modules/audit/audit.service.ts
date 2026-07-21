import { Injectable } from "@nestjs/common";
import { prisma } from "@navicore/db";

interface AuditLogFilters {
  entityType?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AuditService {
  /**
   * Organization-wide, not workspace-scoped like ActivityController (Phase
   * 2) — this is the actual "audit center" Phase 10 calls for, and needs to
   * cover org-only events (API key create/revoke, workspace-member changes)
   * alongside every workspace's own activity, in one filterable view. See
   * ActivityLog's schema comment on why workspaceId is nullable.
   */
  async search(organizationId: string, filters: AuditLogFilters, cursor?: string, limit = 50) {
    const items = await prisma.activityLog.findMany({
      where: {
        organizationId,
        entityType: filters.entityType,
        actorId: filters.actorId,
        createdAt: {
          gte: filters.from,
          lte: filters.to,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return { data: page, meta: { nextCursor: hasMore ? page[page.length - 1]!.id : null } };
  }
}
