import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { PermissionsService } from "../rbac/permissions.service";
import { CreateTaskDto, LogTimeDto, MoveTaskDto, UpdateTaskDto } from "./dto/task.dto";

@Injectable()
export class TasksService {
  constructor(
    private readonly events: EventEmitter2,
    private readonly permissions: PermissionsService,
  ) {}

  private async organizationIdFor(workspaceId: string): Promise<string> {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    return workspace.organizationId;
  }

  private emit(
    workspaceId: string,
    organizationId: string,
    actorId: string,
    action: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    this.events.emit(`task.${action}`, {
      organizationId,
      workspaceId,
      actorId,
      entityType: "task",
      entityId,
      action,
      metadata,
    });
  }

  async create(workspaceId: string, projectId: string, dto: CreateTaskDto, actorId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
    });
    if (!project) throw new NotFoundException("Project not found");

    const statusId =
      dto.statusId ??
      (
        await prisma.taskStatus.findFirstOrThrow({
          where: { projectId, isDefault: true },
        })
      ).id;

    const maxOrder = await prisma.task.aggregate({
      where: { projectId, statusId },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        projectId,
        statusId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order: (maxOrder._max.order ?? -1) + 1,
        createdById: actorId,
      },
    });

    const organizationId = await this.organizationIdFor(workspaceId);
    this.emit(workspaceId, organizationId, actorId, "created", task.id, { projectId });
    if (dto.assigneeId) {
      this.emit(workspaceId, organizationId, actorId, "assigned", task.id, {
        assigneeId: dto.assigneeId,
      });
    }

    return task;
  }

  async findAllForProject(workspaceId: string, projectId: string) {
    return prisma.task.findMany({
      where: { projectId, project: { workspaceId }, deletedAt: null },
      orderBy: [{ statusId: "asc" }, { order: "asc" }],
    });
  }

  async findOne(workspaceId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId }, deletedAt: null },
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async update(workspaceId: string, taskId: string, dto: UpdateTaskDto, actorId: string) {
    const existing = await this.findOne(workspaceId, taskId);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    const organizationId = await this.organizationIdFor(workspaceId);
    this.emit(workspaceId, organizationId, actorId, "updated", taskId, dto as Record<string, unknown>);
    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      this.emit(workspaceId, organizationId, actorId, "assigned", taskId, {
        assigneeId: dto.assigneeId,
      });
    }

    return updated;
  }

  /** Kanban drag-and-drop: change column and/or position within a column. */
  async move(workspaceId: string, taskId: string, dto: MoveTaskDto, actorId: string) {
    const existing = await this.findOne(workspaceId, taskId);

    const status = await prisma.taskStatus.findFirst({
      where: { id: dto.statusId, projectId: existing.projectId },
    });
    if (!status) throw new NotFoundException("Target column not found in this task's project");

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { statusId: dto.statusId, order: dto.order },
    });

    if (dto.statusId !== existing.statusId) {
      const organizationId = await this.organizationIdFor(workspaceId);
      this.emit(workspaceId, organizationId, actorId, "status_changed", taskId, {
        fromStatusId: existing.statusId,
        toStatusId: dto.statusId,
      });
    }

    return updated;
  }

  async logTime(workspaceId: string, taskId: string, dto: LogTimeDto, actorId: string) {
    await this.findOne(workspaceId, taskId);
    return prisma.timeEntry.create({
      data: { taskId, userId: actorId, minutes: dto.minutes, note: dto.note },
    });
  }

  async remove(workspaceId: string, taskId: string, actorId: string) {
    const existing = await this.findOne(workspaceId, taskId);

    // "own only" for Member, per the RBAC matrix — see the same pattern in
    // ProjectsService.assertCanModify. Duplicated rather than shared because
    // the two checks look at different creator fields on different models;
    // a shared helper would need to take both as parameters anyway.
    const membership = await this.permissions.getWorkspaceRole(actorId, workspaceId);
    if (membership?.role.name === "Member" && existing.createdById !== actorId) {
      throw new ForbiddenException("Members can only delete tasks they created");
    }

    const deleted = await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    const organizationId = await this.organizationIdFor(workspaceId);
    this.emit(workspaceId, organizationId, actorId, "deleted", taskId);

    return deleted;
  }
}
