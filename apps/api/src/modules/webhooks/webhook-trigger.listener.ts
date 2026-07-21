import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { prisma } from "@navicore/db";
import { DomainEvent } from "../../common/domain-event";
import { WEBHOOK_DELIVERIES_QUEUE } from "../queue/queue.module";
import { matchesEventPattern } from "./event-pattern.util";

@Injectable()
export class WebhookTriggerListener {
  constructor(@InjectQueue(WEBHOOK_DELIVERIES_QUEUE) private readonly queue: Queue) {}

  @OnEvent("**")
  async handle(event: DomainEvent, eventName?: string): Promise<void> {
    // NestJS's EventEmitter2 passes the matched event name as the listener's
    // own `event.event` in some versions and as a second arg in others —
    // reconstructing it from the payload's own fields instead of relying on
    // either avoids depending on that detail.
    const eventType = `${event.entityType}.${event.action}`;
    void eventName; // intentionally unused — see comment above

    const subscriptions = await prisma.webhookSubscription.findMany({
      where: { workspaceId: event.workspaceId, isActive: true },
    });

    const matching = subscriptions.filter((s) => matchesEventPattern(eventType, s.eventPattern));
    if (matching.length === 0) return;

    for (const subscription of matching) {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          eventType,
          payload: event as never,
        },
      });

      await this.queue.add(
        "deliver",
        { deliveryId: delivery.id },
        { attempts: 5, backoff: { type: "exponential", delay: 10_000 } },
      );
    }
  }
}
