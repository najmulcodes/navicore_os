import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { DomainEvent } from "../../common/domain-event";

@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  // Wildcard subscriber — requires EventEmitterModule.forRoot({ wildcard: true })
  // in app.module.ts. Every module emits `${entityType}.${action}`; this is
  // the one place that turns all of them into ActivityLog rows, so no
  // individual service needs to remember to write its own audit row.
  @OnEvent("**")
  async handle(event: DomainEvent): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          organizationId: event.organizationId,
          workspaceId: event.workspaceId,
          actorId: event.actorId,
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.action,
          metadata: event.metadata as never,
        },
      });
    } catch (error) {
      // Activity logging is best-effort — a write failure here should never
      // fail the business operation that triggered it (EventEmitter2 emits
      // are fire-and-forget from the caller's perspective already, but this
      // guards against an unhandled rejection crashing the process).
      this.logger.error(`Failed to write activity log: ${(error as Error).message}`, event);
    }
  }
}
