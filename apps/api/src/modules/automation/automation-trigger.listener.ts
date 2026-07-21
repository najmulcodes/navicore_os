import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { DomainEvent } from "../../common/domain-event";
import { AUTOMATION_TRIGGERS_QUEUE } from "../queue/queue.module";

@Injectable()
export class AutomationTriggerListener {
  constructor(@InjectQueue(AUTOMATION_TRIGGERS_QUEUE) private readonly queue: Queue) {}

  /**
   * Same wildcard subscription as ActivityListener, different destination:
   * ActivityListener writes straight to Postgres (fine for an audit log —
   * losing one on a crash mid-write is an acceptable, rare gap). Automation
   * needs to survive a worker restart between "event happened" and
   * "workflow ran", so this goes through Redis-backed BullMQ instead of
   * being handled in-process. See the schema comment on the Automation
   * models and TECH_DEBT.md's original item #1 from Phase 0 planning.
   */
  @OnEvent("**")
  async handle(event: DomainEvent): Promise<void> {
    await this.queue.add("trigger", event, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  }
}
