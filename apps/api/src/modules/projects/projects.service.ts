import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { PermissionsService } from "../rbac/permissions.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";

const DEFAULT_COLUMNS = ["Backlog", "In Progress", "Done"];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly events: EventEmitter2,
    private readonly permissions: PermissionsService,
  ) {}

  /**
   * The RBAC matrix (docs/PHASE_0_ARCHITECTURE.md §4) grants Member
   * projects:update/delete "own only" — Owner/Admin aren't restricted.
   * PermissionGuard already confirmed the caller has the base permission;
   * this is the additional per-resource check for the "own only" tier.
   */
  private async assertCanModify(workspaceId: string, actorId: string, createdById: string) {
    const membership = await this.permissions.getWorkspaceRole(actorId, workspaceId);
    if (membership?.role.name === "Member" && createdById !== actorId) {
      throw new ForbiddenException("Members can only modify projects they created");
    }
  }

  private async organizationIdFor(workspaceId: string): Promise<string> {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    return workspace.organizationId;
  }

  async create(workspaceId: string, dto: CreateProjectDto, actorId: string) {
    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          name: dto.name,
          description: dto.description,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          createdById: actorId,
        },
      });
      await tx.taskStatus.createMany({
        data: DEFAULT_COLUMNS.map((name, order) => ({
          projectId: created.id,
          name,
          order,
          isDefault: order === 0,
          isTerminal: order === DEFAULT_COLUMNS.length - 1,
        })),
      });
      return created;
    });

    this.events.emit("project.created", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "project",
      entityId: project.id,
      action: "created",
    });

    return project;
  }

  async findAll(workspaceId: string) {
    return prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(workspaceId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      include: { columns: { orderBy: { order: "asc" } } },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async update(workspaceId: string, projectId: string, dto: UpdateProjectDto, actorId: string) {
    const existing = await this.findOne(workspaceId, projectId);
    await this.assertCanModify(workspaceId, actorId, existing.createdById);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    this.events.emit("project.updated", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "project",
      entityId: projectId,
      action: "updated",
      metadata: dto as Record<string, unknown>,
    });

    return updated;
  }

  async softDelete(workspaceId: string, projectId: string, actorId: string) {
    const existing = await this.findOne(workspaceId, projectId);
    await this.assertCanModify(workspaceId, actorId, existing.createdById);

    const deleted = await prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });

    this.events.emit("project.deleted", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "project",
      entityId: projectId,
      action: "deleted",
    });

    return deleted;
  }
}
