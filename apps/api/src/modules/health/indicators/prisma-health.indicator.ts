import { Injectable } from "@nestjs/common";
import { HealthIndicatorResult, HealthIndicatorService } from "@nestjs/terminus";
import { prisma } from "@navicore/db";

/**
 * No built-in Terminus indicator exists for Prisma (only TypeORM/Mongoose/
 * Sequelize ship in the box), so this is hand-rolled — same "SELECT 1" probe
 * TypeOrmHealthIndicator runs under the hood.
 *
 * Uses Terminus's current HealthIndicatorService API. The older
 * `HealthIndicator` base class + `HealthCheckError` are deprecated as of
 * @nestjs/terminus 11 and scheduled for removal in 12 — see
 * https://github.com/nestjs/terminus/releases/tag/v11.0.0.
 */
@Injectable()
export class PrismaHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await prisma.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : "Unknown database error",
      });
    }
  }
}
