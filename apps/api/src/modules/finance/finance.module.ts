import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { FinanceService } from "./finance.service";
import { BudgetsController, ExpensesController, InvoicesController } from "./finance.controller";

@Module({
  imports: [RbacModule],
  controllers: [InvoicesController, ExpensesController, BudgetsController],
  providers: [FinanceService],
})
export class FinanceModule {}
