import { Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { prisma } from "@navicore/db";
import { DomainEvent } from "../../common/domain-event";
import { AUTOMATION_TRIGGERS_QUEUE } from "../queue/queue.module";
import { executeCreateTask } from "./actions/create-task.action";
import { executeSendWebhook } from "./actions/send-webhook.action";
import { executeCreateNotification } from "./actions/create-notification.action";

@Injectable()
@Processor(AUTOMATION_TRIGGERS_QUEUE)
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  async process(job: Job<DomainEvent>): Promise<void> {
    const event = job.data;

    // Org-level events (no workspaceId) have no workspace-scoped workflow to
    // match against — automation triggers are always workspace-scoped.
    if (!event.workspaceId) return;

    const workflows = await prisma.workflow.findMany({
      where: {
        workspaceId: event.workspaceId,
        triggerEntityType: event.entityType,
        triggerAction: event.action,
        isActive: true,
      },
      include: { actions: { orderBy: { order: "asc" } } },
    });

    for (const workflow of workflows) {
      if (!this.matchesConditions(workflow.conditions, event.metadata)) {
        continue;
      }
      await this.runWorkflow(workflow, event);
    }
  }

  /**
   * Flat equality only — every key in `conditions` must equal the same key
   * in the event's metadata. No AND/OR trees, no comparison operators. This
   * is a deliberately small first version of the "conditions" part of
   * "triggers → conditions → actions" — see TECH_DEBT.md on what a real
   * rule engine would need instead.
   */
  private matchesConditions(
    conditions: unknown,
    metadata: Record<string, unknown> | null | undefined,
  ): boolean {
    if (!conditions || typeof conditions !== "object") return true;
    const entries = Object.entries(conditions as Record<string, unknown>);
    if (entries.length === 0) return true;
    if (!metadata) return false;

    return entries.every(([key, value]) => metadata[key] === value);
  }

  private async runWorkflow(
    workflow: { id: string; createdById: string; actions: Array<{ actionType: string; config: unknown }> },
    event: DomainEvent,
  ): Promise<void> {
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        status: "SUCCESS", // optimistic; flipped to FAILED in the catch block below
        triggerPayload: event as never,
      },
    });

    try {
      for (const action of workflow.actions) {
        const context = { event, workflowCreatedById: workflow.createdById };
        switch (action.actionType) {
          case "CREATE_TASK":
            await executeCreateTask(action.config as never, context);
            break;
          case "SEND_WEBHOOK":
            await executeSendWebhook(action.config as never, context);
            break;
          case "CREATE_NOTIFICATION":
            await executeCreateNotification(action.config as never, context);
            break;
          default:
            throw new Error(`Unknown action type: ${action.actionType}`);
        }
      }
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { finishedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Workflow ${workflow.id} failed: ${(error as Error).message}`);
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "FAILED", error: (error as Error).message, finishedAt: new Date() },
      });
    }
  }
}
