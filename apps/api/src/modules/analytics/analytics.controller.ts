import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { AnalyticsService } from "./analytics.service";
import { SavedReportsService } from "./saved-reports.service";
import { CreateSavedReportDto } from "./dto/saved-report.dto";

@Controller("workspaces/:workspaceId/analytics")
@UseGuards(PermissionGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("summary")
  summary(@Param("workspaceId") workspaceId: string) {
    return this.analytics.dashboardSummary(workspaceId);
  }

  @Get("deals-by-stage")
  dealsByStage(@Param("workspaceId") workspaceId: string) {
    return this.analytics.dealsByStage(workspaceId);
  }

  @Get("tasks-by-assignee")
  tasksByAssignee(@Param("workspaceId") workspaceId: string) {
    return this.analytics.tasksByAssignee(workspaceId);
  }

  @Get("invoice-aging")
  invoiceAging(@Param("workspaceId") workspaceId: string) {
    return this.analytics.invoiceAging(workspaceId);
  }
}

@Controller("workspaces/:workspaceId/reports")
@UseGuards(PermissionGuard)
export class SavedReportsController {
  constructor(private readonly reports: SavedReportsService) {}

  @Post()
  @RequirePermission("analytics:manage_reports")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateSavedReportDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reports.create(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.reports.findAll(workspaceId);
  }

  @Delete(":reportId")
  @RequirePermission("analytics:manage_reports")
  remove(@Param("workspaceId") workspaceId: string, @Param("reportId") reportId: string) {
    return this.reports.remove(workspaceId, reportId);
  }

  @Get(":reportId/run")
  run(@Param("workspaceId") workspaceId: string, @Param("reportId") reportId: string) {
    return this.reports.run(workspaceId, reportId);
  }
}
