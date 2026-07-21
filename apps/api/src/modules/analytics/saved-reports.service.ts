import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { AnalyticsService } from "./analytics.service";
import { CreateSavedReportDto } from "./dto/saved-report.dto";

@Injectable()
export class SavedReportsService {
  constructor(private readonly analytics: AnalyticsService) {}

  create(workspaceId: string, dto: CreateSavedReportDto, actorId: string) {
    return prisma.savedReport.create({
      data: {
        workspaceId,
        name: dto.name,
        type: dto.type,
        filters: dto.filters as never,
        createdById: actorId,
      },
    });
  }

  findAll(workspaceId: string) {
    return prisma.savedReport.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  }

  async remove(workspaceId: string, reportId: string) {
    const existing = await prisma.savedReport.findFirst({ where: { id: reportId, workspaceId } });
    if (!existing) throw new NotFoundException("Report not found");
    return prisma.savedReport.delete({ where: { id: reportId } });
  }

  /**
   * `filters` isn't actually applied yet for any report type — every type
   * currently just runs its corresponding AnalyticsService method
   * unfiltered. The field exists in the schema and DTO so saved reports
   * have somewhere to put date-range/scoping config once that's wired up.
   * See TECH_DEBT.md.
   */
  async run(workspaceId: string, reportId: string) {
    const report = await prisma.savedReport.findFirst({ where: { id: reportId, workspaceId } });
    if (!report) throw new NotFoundException("Report not found");

    switch (report.type) {
      case "DEALS_BY_STAGE":
        return this.analytics.dealsByStage(workspaceId);
      case "TASKS_BY_ASSIGNEE":
        return this.analytics.tasksByAssignee(workspaceId);
      case "INVOICE_AGING":
        return this.analytics.invoiceAging(workspaceId);
      case "REVENUE_FORECAST":
        return { weightedPipelineValueCents: await this.analytics.weightedPipelineValue(workspaceId) };
    }
  }
}
