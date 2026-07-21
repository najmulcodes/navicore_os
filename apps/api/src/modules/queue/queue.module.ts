import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

export const AUTOMATION_TRIGGERS_QUEUE = "automation-triggers";
export const WEBHOOK_DELIVERIES_QUEUE = "webhook-deliveries";

function parseRedisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}

/**
 * Registers the two Phase 7 queues against a shared Redis connection. Split
 * into its own module (rather than each feature module calling
 * BullModule.forRoot itself) because forRoot is app-wide — calling it more
 * than once is a Nest anti-pattern this avoids by construction.
 */
@Module({
  imports: [
    BullModule.forRoot({ connection: parseRedisConnection() }),
    BullModule.registerQueue({ name: AUTOMATION_TRIGGERS_QUEUE }, { name: WEBHOOK_DELIVERIES_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
