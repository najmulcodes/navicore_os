import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { CreateWorkspaceDto, UpdateWorkspaceDto } from "./dto/workspace.dto";

@Injectable()
export class WorkspacesService {
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

    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { organizationId, name: dto.name, slug: dto.slug },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: creatorUserId, roleId: ownerRole.id },
      });
      return workspace;
    });
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

  async addMember(workspaceId: string, userId: string, roleName: string) {
    const role = await prisma.role.findFirst({
      where: { organizationId: null, name: roleName, isSystem: true },
    });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    return prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      update: { roleId: role.id },
      create: { workspaceId, userId, roleId: role.id },
    });
  }

  async updateMemberRole(workspaceId: string, userId: string, roleName: string) {
    const role = await prisma.role.findFirst({
      where: { organizationId: null, name: roleName, isSystem: true },
    });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    return prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { roleId: role.id },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }
}
