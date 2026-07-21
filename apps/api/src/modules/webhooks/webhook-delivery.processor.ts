import { Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { createHmac } from "node:crypto";
import { prisma } from "@navicore/db";
import { WEBHOOK_DELIVERIES_QUEUE } from "../queue/queue.module";

interface DeliverJobData {
  deliveryId: string;
}

@Injectable()
@Processor(WEBHOOK_DELIVERIES_QUEUE)
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  async process(job: Job<DeliverJobData>): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUniqueOrThrow({
      where: { id: job.data.deliveryId },
      include: { subscription: true },
    });

    const body = JSON.stringify(delivery.payload);
    // Same HMAC-SHA256-over-raw-body pattern this codebase consumes from
    // Stripe (see modules/billing/billing.service.ts) — subscribers verify
    // this the same way this app verifies Stripe's signature.
    const signature = createHmac("sha256", delivery.subscription.secret).update(body).digest("hex");

    try {
      const response = await fetch(delivery.subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-navicore-signature": signature,
          "x-navicore-event": delivery.eventType,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        // Thrown (not just recorded) so BullMQ's attempts/backoff config
        // actually retries this job — caught and recorded once, below.
        throw new WebhookHttpError(response.status);
      }

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SUCCESS",
          responseStatus: response.status,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(`Webhook delivery ${delivery.id} attempt failed: ${(error as Error).message}`);
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          responseStatus: error instanceof WebhookHttpError ? error.status : null,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      throw error;
    }
  }
}

class WebhookHttpError extends Error {
  constructor(public readonly status: number) {
    super(`Webhook endpoint responded ${status}`);
  }
}
