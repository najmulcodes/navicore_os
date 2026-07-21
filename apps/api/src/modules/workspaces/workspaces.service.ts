import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { CreateWorkspaceDto, UpdateWorkspaceDto } from "./dto/workspace.dto";

@Injectable()
export class WorkspacesService {
  constructor(private readonly events: EventEmitter2) {}

  async create(organizationId: string, dto: CreateWorkspaceDto, creatorUserId: string) {
    const existing = await prisma.workspace.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
    });
    if (existing) {
      throw new ConflictException(`Workspace slug "${dto.slug}" is already in use in this organization`);
    }

    const ownerRole = await prisma.role.findFirst({
      where: { organizationId: null, name: "Owner", isSystem: true },
    });
    if (!ownerRole) {
      // Should be impossible outside a not-yet-seeded database — see
      // prisma/seed.ts, which every environment must run before this module
      // can function at all.
      throw new NotFoundException(
        "System role 'Owner' not found — has `pnpm db:seed` been run against this database?",
      );
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: { organizationId, name: dto.name, slug: dto.slug },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: created.id, userId: creatorUserId, roleId: ownerRole.id },
      });
      return created;
    });

    this.events.emit("workspace.created", {
      organizationId,
      workspaceId: workspace.id,
      actorId: creatorUserId,
      entityType: "workspace",
      entityId: workspace.id,
      action: "created",
    });

    return workspace;
  }

  async findAllForOrganization(organizationId: string) {
    return prisma.workspace.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    return workspace;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    await this.findOne(workspaceId);
    return prisma.workspace.update({ where: { id: workspaceId }, data: dto });
  }

  async softDelete(workspaceId: string) {
    await this.findOne(workspaceId);
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });
  }

  async listMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { role: { select: { name: true } }, user: { select: { id: true, name: true, email: true, image: true } } },
    });
  }

  /**
   * Member add/role-change/remove are exactly the kind of action a real
   * audit center (Phase 10) needs to surface — see AuditController. Every
   * one of these now emits a domain event, which is new: earlier phases'
   * WorkspacesService didn't, a real gap worth naming rather than leaving
   * silent (member/role changes are a materially more security-sensitive
   * event than, say, a task being renamed).
   */
  async addMember(workspaceId: string, userId: string, roleName: string, actorId: string) {
    const role = await prisma.role.findFirst({
      where: { organizationId: null, name: roleName, isSystem: true },
    });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    const member = await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      update: { roleId: role.id },
      create: { workspaceId, userId, roleId: role.id },
    });

    await this.emitMemberEvent(workspaceId, actorId, "member_added", { userId, role: roleName });
    return member;
  }

  async updateMemberRole(workspaceId: string, userId: string, roleName: string, actorId: string) {
    const role = await prisma.role.findFirst({
      where: { organizationId: null, name: roleName, isSystem: true },
    });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    const member = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { roleId: role.id },
    });

    await this.emitMemberEvent(workspaceId, actorId, "member_role_changed", { userId, newRole: roleName });
    return member;
  }

  async removeMember(workspaceId: string, userId: string, actorId: string) {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    await this.emitMemberEvent(workspaceId, actorId, "member_removed", { userId });
  }

  private async emitMemberEvent(
    workspaceId: string,
    actorId: string,
    action: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    this.events.emit(`workspace_member.${action}`, {
      organizationId: workspace.organizationId,
      workspaceId,
      actorId,
      entityType: "workspace_member",
      entityId: workspaceId,
      action,
      metadata,
    });
  }
}
