import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { AnalyticsService } from "./analytics.service";
import { SavedReportsService } from "./saved-reports.service";
import { AnalyticsController, SavedReportsController } from "./analytics.controller";

@Module({
  imports: [RbacModule],
  controllers: [AnalyticsController, SavedReportsController],
  providers: [AnalyticsService, SavedReportsService],
})
export class AnalyticsModule {}
