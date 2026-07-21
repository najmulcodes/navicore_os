import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";

@Injectable()
export class PermissionOverridesService {
  constructor(private readonly events: EventEmitter2) {}

  async grant(
    workspaceId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    permissionKey: string,
    grantedById: string,
  ) {
    const override = await prisma.resourcePermissionOverride.upsert({
      where: {
        workspaceId_userId_resourceType_resourceId_permissionKey: {
          workspaceId,
          userId,
          resourceType,
          resourceId,
          permissionKey,
        },
      },
      update: {},
      create: { workspaceId, userId, resourceType, resourceId, permissionKey, grantedById },
    });

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    this.events.emit("permission_override.granted", {
      organizationId: workspace.organizationId,
      workspaceId,
      actorId: grantedById,
      entityType: "permission_override",
      entityId: override.id,
      action: "granted",
      metadata: { userId, resourceType, resourceId, permissionKey },
    });

    return override;
  }

  async revoke(workspaceId: string, overrideId: string, actorId: string) {
    // delete()'s `where` must be a valid unique lookup on its own — it can't
    // take workspaceId as an extra filter the way findFirst/findMany can.
    // Verify workspace ownership first, then delete by id alone.
    const existing = await prisma.resourcePermissionOverride.findFirst({
      where: { id: overrideId, workspaceId },
    });
    if (!existing) throw new NotFoundException("Permission override not found");

    await prisma.resourcePermissionOverride.delete({ where: { id: overrideId } });

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    this.events.emit("permission_override.revoked", {
      organizationId: workspace.organizationId,
      workspaceId,
      actorId,
      entityType: "permission_override",
      entityId: overrideId,
      action: "revoked",
      metadata: { userId: existing.userId, resourceType: existing.resourceType, resourceId: existing.resourceId },
    });
  }

  findForUser(workspaceId: string, userId: string) {
    return prisma.resourcePermissionOverride.findMany({ where: { workspaceId, userId } });
  }
}
