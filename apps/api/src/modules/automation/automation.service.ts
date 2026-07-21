import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto/workflow.dto";

@Injectable()
export class AutomationService {
  create(workspaceId: string, dto: CreateWorkflowDto, actorId: string) {
    return prisma.workflow.create({
      data: {
        workspaceId,
        name: dto.name,
        triggerEntityType: dto.triggerEntityType,
        triggerAction: dto.triggerAction,
        conditions: dto.conditions as never,
        createdById: actorId,
        actions: {
          create: dto.actions.map((a) => ({
            order: a.order,
            actionType: a.actionType,
            config: a.config as never,
          })),
        },
      },
      include: { actions: true },
    });
  }

  findAll(workspaceId: string) {
    return prisma.workflow.findMany({
      where: { workspaceId },
      include: { actions: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(workspaceId: string, workflowId: string) {
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, workspaceId },
      include: { actions: { orderBy: { order: "asc" } } },
    });
    if (!workflow) throw new NotFoundException("Workflow not found");
    return workflow;
  }

  async update(workspaceId: string, workflowId: string, dto: UpdateWorkflowDto) {
    await this.findOne(workspaceId, workflowId);
    return prisma.workflow.update({ where: { id: workflowId }, data: dto });
  }

  async remove(workspaceId: string, workflowId: string) {
    await this.findOne(workspaceId, workflowId);
    return prisma.workflow.delete({ where: { id: workflowId } });
  }

  async findRuns(workspaceId: string, workflowId: string) {
    await this.findOne(workspaceId, workflowId);
    return prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
  }
}
