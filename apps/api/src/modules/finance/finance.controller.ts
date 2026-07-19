import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { FinanceService } from "./finance.service";
import {
  CreateBudgetDto,
  CreateExpenseDto,
  CreateInvoiceDto,
  ReviewExpenseDto,
  UpdateInvoiceStatusDto,
} from "./dto/finance.dto";

@Controller("workspaces/:workspaceId/invoices")
@UseGuards(PermissionGuard)
export class InvoicesController {
  constructor(private readonly finance: FinanceService) {}

  @Post()
  @RequirePermission("invoices:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.finance.createInvoice(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.finance.findInvoices(workspaceId);
  }

  @Get(":invoiceId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("invoiceId") invoiceId: string) {
    return this.finance.findInvoice(workspaceId, invoiceId);
  }

  @Patch(":invoiceId/status")
  @RequirePermission("invoices:update")
  updateStatus(
    @Param("workspaceId") workspaceId: string,
    @Param("invoiceId") invoiceId: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.finance.updateInvoiceStatus(workspaceId, invoiceId, dto.status);
  }
}

@Controller("workspaces/:workspaceId/expenses")
@UseGuards(PermissionGuard)
export class ExpensesController {
  constructor(private readonly finance: FinanceService) {}

  @Post()
  @RequirePermission("expenses:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.finance.createExpense(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.finance.findExpenses(workspaceId);
  }

  @Patch(":expenseId/review")
  @RequirePermission("expenses:approve")
  review(
    @Param("workspaceId") workspaceId: string,
    @Param("expenseId") expenseId: string,
    @Body() dto: ReviewExpenseDto,
  ) {
    return this.finance.reviewExpense(workspaceId, expenseId, dto.status);
  }
}

@Controller("workspaces/:workspaceId/budgets")
@UseGuards(PermissionGuard)
export class BudgetsController {
  constructor(private readonly finance: FinanceService) {}

  @Post()
  @RequirePermission("budgets:manage")
  create(@Param("workspaceId") workspaceId: string, @Body() dto: CreateBudgetDto) {
    return this.finance.createBudget(workspaceId, dto);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.finance.findBudgets(workspaceId);
  }

  @Get(":budgetId/utilization")
  utilization(@Param("workspaceId") workspaceId: string, @Param("budgetId") budgetId: string) {
    return this.finance.budgetUtilization(workspaceId, budgetId);
  }
}
