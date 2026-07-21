import { prisma } from "@navicore/db";
import { DomainEvent } from "../../../common/domain-event";

interface CreateTaskConfig {
  projectId: string;
  title: string;
  assigneeId?: string;
}

/**
 * Automation-created tasks are attributed to the workflow's creator, not a
 * synthetic "system" user — there's no such user in the schema, and
 * attributing to whoever set up the automation is the more honest audit
 * trail anyway ("this task exists because so-and-so's workflow created it").
 */
export async function executeCreateTask(
  config: CreateTaskConfig,
  context: { event: DomainEvent; workflowCreatedById: string },
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: config.projectId, deletedAt: null },
  });
  if (!project) {
    throw new Error(`CREATE_TASK action: project ${config.projectId} not found`);
  }

  const defaultStatus = await prisma.taskStatus.findFirstOrThrow({
    where: { projectId: config.projectId, isDefault: true },
  });
  const maxOrder = await prisma.task.aggregate({
    where: { projectId: config.projectId, statusId: defaultStatus.id },
    _max: { order: true },
  });

  await prisma.task.create({
    data: {
      projectId: config.projectId,
      statusId: defaultStatus.id,
      title: config.title,
      assigneeId: config.assigneeId,
      order: (maxOrder._max.order ?? -1) + 1,
      createdById: context.workflowCreatedById,
    },
  });
}
