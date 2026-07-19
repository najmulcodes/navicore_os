import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { HealthIndicatorResult, HealthIndicatorService } from "@nestjs/terminus";
import Redis from "ioredis";

@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  // A connection dedicated to health checks — not the pool BullMQ will use
  // for job processing once Phase 2 lands. Keeping health-probe I/O isolated
  // means a saturated job queue can't make the health endpoint itself report
  // unhealthy.
  private readonly client: Redis;

  constructor(private readonly healthIndicatorService: HealthIndicatorService) {
    // Read directly from process.env rather than @navicore/config's loadEnv()
    // here: by the time Nest's DI container constructs this provider,
    // main.ts's loadEnv() has already run and would have thrown on an invalid
    // REDIS_URL. A typed, DI-injectable EnvService (so providers never touch
    // process.env directly) is worth adding once more than one provider needs
    // env access — tracked for Milestone 1.2, not this one.
    const connectionString = process.env.REDIS_URL;
    if (!connectionString) {
      throw new Error("REDIS_URL is not set — should have been caught by loadEnv() at boot.");
    }

    this.client = new Redis(connectionString, {
      // Fail fast rather than retrying indefinitely — this is a health probe,
      // not a long-lived application connection.
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.client.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : "Unknown Redis error",
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
