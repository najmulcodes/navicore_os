import { Injectable } from "@nestjs/common";
import { prisma } from "@navicore/db";

@Injectable()
export class PermissionsService {
  /**
   * True if `userId` is a member of `workspaceId` and that membership's role
   * grants `permissionKey` (e.g. "projects:create" — see
   * docs/PHASE_0_ARCHITECTURE.md §4 for the full matrix).
   *
   * One query via Prisma's relation-filtering `some`, not three round trips —
   * WorkspaceMember -> Role -> RolePermission -> Permission is resolved
   * server-side in Postgres.
   */
  async hasPermission(
    userId: string,
    workspaceId: string,
    permissionKey: string,
  ): Promise<boolean> {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
        role: {
          permissions: {
            some: { permission: { key: permissionKey } },
          },
        },
      },
      select: { id: true },
    });

    return membership !== null;
  }

  /**
   * "Own only" permissions (see §4's matrix — e.g. a Member can update tasks
   * they created, not just ones a blanket permission covers) need the
   * resource's owner id, which callers already have after loading the
   * resource. This just centralizes the comparison so it isn't duplicated
   * across every service that has an "own only" tier.
   */
  isOwner(userId: string, resourceOwnerId: string | null | undefined): boolean {
    return resourceOwnerId != null && resourceOwnerId === userId;
  }

  async getWorkspaceRole(userId: string, workspaceId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { role: true },
    });
  }
}
