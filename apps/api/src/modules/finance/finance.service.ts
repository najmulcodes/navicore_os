import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { CreateBudgetDto, CreateExpenseDto, CreateInvoiceDto } from "./dto/finance.dto";

@Injectable()
export class FinanceService {
  // --- Invoices ------------------------------------------------------------

  async createInvoice(workspaceId: string, dto: CreateInvoiceDto, actorId: string) {
    const subtotalCents = dto.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
    // Flat-rate placeholder — real tax calculation (jurisdiction-aware) is
    // out of scope here; see TECH_DEBT.md.
    const taxCents = 0;

    return prisma.invoice.create({
      data: {
        workspaceId,
        companyId: dto.companyId,
        contactId: dto.contactId,
        invoiceNumber: dto.invoiceNumber,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        currency: dto.currency ?? "USD",
        subtotalCents,
        taxCents,
        totalCents: subtotalCents + taxCents,
        createdById: actorId,
        lineItems: {
          create: dto.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
            amountCents: li.quantity * li.unitPriceCents,
          })),
        },
      },
      include: { lineItems: true },
    });
  }

  findInvoices(workspaceId: string) {
    return prisma.invoice.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { issueDate: "desc" },
    });
  }

  async findInvoice(workspaceId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, workspaceId, deletedAt: null },
      include: { lineItems: true, payments: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async updateInvoiceStatus(
    workspaceId: string,
    invoiceId: string,
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID",
  ) {
    await this.findInvoice(workspaceId, invoiceId);
    return prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  }

  // --- Expenses --------------------------------------------------------------

  createExpense(workspaceId: string, dto: CreateExpenseDto, actorId: string) {
    return prisma.expense.create({
      data: {
        workspaceId,
        category: dto.category,
        amountCents: dto.amountCents,
        currency: dto.currency ?? "USD",
        incurredAt: new Date(dto.incurredAt),
        description: dto.description,
        receiptStorageKey: dto.receiptStorageKey,
        submittedById: actorId,
      },
    });
  }

  findExpenses(workspaceId: string) {
    return prisma.expense.findMany({ where: { workspaceId }, orderBy: { incurredAt: "desc" } });
  }

  async reviewExpense(
    workspaceId: string,
    expenseId: string,
    status: "APPROVED" | "REJECTED" | "REIMBURSED",
  ) {
    const expense = await prisma.expense.findFirst({ where: { id: expenseId, workspaceId } });
    if (!expense) throw new NotFoundException("Expense not found");
    return prisma.expense.update({ where: { id: expenseId }, data: { status } });
  }

  // --- Budgets -----------------------------------------------------------------

  createBudget(workspaceId: string, dto: CreateBudgetDto) {
    return prisma.budget.create({
      data: {
        workspaceId,
        name: dto.name,
        category: dto.category,
        amountCents: dto.amountCents,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });
  }

  findBudgets(workspaceId: string) {
    return prisma.budget.findMany({ where: { workspaceId }, orderBy: { periodStart: "desc" } });
  }

  /** Actual spend against a budget's category + period, from approved/reimbursed Expenses. */
  async budgetUtilization(workspaceId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({ where: { id: budgetId, workspaceId } });
    if (!budget) throw new NotFoundException("Budget not found");

    const spent = await prisma.expense.aggregate({
      where: {
        workspaceId,
        category: budget.category ?? undefined,
        incurredAt: { gte: budget.periodStart, lte: budget.periodEnd },
        status: { in: ["APPROVED", "REIMBURSED"] },
      },
      _sum: { amountCents: true },
    });

    return {
      budget,
      spentCents: spent._sum.amountCents ?? 0,
      remainingCents: budget.amountCents - (spent._sum.amountCents ?? 0),
    };
  }
}
