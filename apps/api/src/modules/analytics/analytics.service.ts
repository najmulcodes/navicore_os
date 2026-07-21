import { Injectable } from "@nestjs/common";
import { prisma } from "@navicore/db";

@Injectable()
export class AnalyticsService {
  /**
   * The headline numbers for the Analytics module's KPI cards (see
   * packages/ui/design-tokens.md's "Stat blocks" pattern — this is the data
   * those cards render). Four independent queries running in parallel
   * rather than one large join — each is a simple, well-indexed aggregate
   * and the tables involved (Task, Deal, Invoice) aren't related to each
   * other in a way a single query could exploit anyway.
   */
  async dashboardSummary(workspaceId: string) {
    const [openTasks, activeDeals, pipelineValue, overdueInvoices] = await Promise.all([
      prisma.task.count({
        where: { project: { workspaceId }, deletedAt: null, status: { isTerminal: false } },
      }),
      prisma.deal.count({ where: { workspaceId, status: "OPEN", deletedAt: null } }),
      this.weightedPipelineValue(workspaceId),
      prisma.invoice.count({
        where: { workspaceId, status: { in: ["SENT"] }, dueDate: { lt: new Date() }, deletedAt: null },
      }),
    ]);

    return { openTasks, activeDeals, weightedPipelineValueCents: pipelineValue, overdueInvoices };
  }

  /**
   * Revenue forecast: sum of each open deal's value weighted by its
   * pipeline stage's probability — exactly what PipelineStage.probability
   * (Phase 3) was modeled for. A real Prisma query can't weight one table's
   * column by a joined table's column directly, so this pulls the (small)
   * set of open deals and does the weighting in application code rather
   * than reaching for raw SQL for what's a straightforward calculation.
   */
  async weightedPipelineValue(workspaceId: string): Promise<number> {
    const openDeals = await prisma.deal.findMany({
      where: { workspaceId, status: "OPEN", deletedAt: null },
      select: { valueCents: true, stage: { select: { probability: true } } },
    });

    return openDeals.reduce((sum, deal) => sum + Math.round((deal.valueCents * deal.stage.probability) / 100), 0);
  }

  async dealsByStage(workspaceId: string) {
    const stages = await prisma.pipelineStage.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
      include: {
        deals: { where: { status: "OPEN", deletedAt: null }, select: { valueCents: true } },
      },
    });

    return stages.map((stage) => ({
      stageId: stage.id,
      stageName: stage.name,
      dealCount: stage.deals.length,
      totalValueCents: stage.deals.reduce((sum, d) => sum + d.valueCents, 0),
    }));
  }

  async tasksByAssignee(workspaceId: string) {
    const grouped = await prisma.task.groupBy({
      by: ["assigneeId"],
      where: { project: { workspaceId }, deletedAt: null },
      _count: { _all: true },
    });

    return grouped
      .filter((g) => g.assigneeId !== null)
      .map((g) => ({ assigneeId: g.assigneeId, taskCount: g._count._all }));
  }

  /** Standard 0-30 / 31-60 / 61-90 / 90+ day aging buckets, by days past due date. */
  async invoiceAging(workspaceId: string) {
    const unpaid = await prisma.invoice.findMany({
      where: { workspaceId, status: { in: ["SENT", "OVERDUE"] }, deletedAt: null },
      select: { id: true, invoiceNumber: true, totalCents: true, dueDate: true },
    });

    const now = Date.now();
    const buckets = { current: 0, days30: 0, days60: 0, days90: 0, daysOver90: 0 };

    for (const invoice of unpaid) {
      const daysPastDue = Math.floor((now - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPastDue <= 0) buckets.current += invoice.totalCents;
      else if (daysPastDue <= 30) buckets.days30 += invoice.totalCents;
      else if (daysPastDue <= 60) buckets.days60 += invoice.totalCents;
      else if (daysPastDue <= 90) buckets.days90 += invoice.totalCents;
      else buckets.daysOver90 += invoice.totalCents;
    }

    return buckets;
  }
}
