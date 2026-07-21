import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

const REPORT_TYPES = ["DEALS_BY_STAGE", "TASKS_BY_ASSIGNEE", "INVOICE_AGING", "REVENUE_FORECAST"] as const;

export class CreateSavedReportDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsIn(REPORT_TYPES) type!: (typeof REPORT_TYPES)[number];
  @IsOptional() @IsObject() filters?: Record<string, unknown>;
}
