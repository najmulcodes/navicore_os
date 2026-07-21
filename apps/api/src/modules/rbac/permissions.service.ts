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

  /**
   * Phase 10 advanced permissions: checks the base role grant (hasPermission)
   * OR a ResourcePermissionOverride for this specific resource — an override
   * can only WIDEN access beyond the role, never narrow it (there's no
   * "deny" override, by design; a workspace-wide role restriction can't be
   * carved around resource-by-resource, which would make the RBAC matrix in
   * §4 impossible to reason about).
   *
   * Not yet wired into any controller's @RequirePermission flow — the
   * schema and this check both exist, but every Phase 2-6 controller still
   * only calls the plain workspace-wide `hasPermission`. Available for a
   * service that specifically needs it; retrofitting every existing
   * controller wasn't in scope for this pass. See TECH_DEBT.md.
   */
  async hasResourcePermission(
    userId: string,
    workspaceId: string,
    resourceType: string,
    resourceId: string,
    permissionKey: string,
  ): Promise<boolean> {
    if (await this.hasPermission(userId, workspaceId, permissionKey)) {
      return true;
    }

    const override = await prisma.resourcePermissionOverride.findUnique({
      where: {
        workspaceId_userId_resourceType_resourceId_permissionKey: {
          workspaceId,
          userId,
          resourceType,
          resourceId,
          permissionKey,
        },
      },
    });

    return override !== null;
  }
}
