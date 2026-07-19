import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class InvoiceLineItemDto {
  @IsString() @IsNotEmpty() description!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsInt() @Min(0) unitPriceCents!: number;
}

export class CreateInvoiceDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsString() @IsNotEmpty() invoiceNumber!: string;
  @IsDateString() issueDate!: string;
  @IsDateString() dueDate!: string;
  @IsOptional() @IsString() currency?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems!: InvoiceLineItemDto[];
}

export class UpdateInvoiceStatusDto {
  @IsIn(["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"])
  status!: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID";
}

export class CreateExpenseDto {
  @IsString() @IsNotEmpty() category!: string;
  @IsInt() @Min(0) amountCents!: number;
  @IsOptional() @IsString() currency?: string;
  @IsDateString() incurredAt!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() receiptStorageKey?: string;
}

export class ReviewExpenseDto {
  @IsIn(["APPROVED", "REJECTED", "REIMBURSED"])
  status!: "APPROVED" | "REJECTED" | "REIMBURSED";
}

export class CreateBudgetDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() category?: string;
  @IsInt() @Min(0) amountCents!: number;
  @IsDateString() periodStart!: string;
  @IsDateString() periodEnd!: string;
}
