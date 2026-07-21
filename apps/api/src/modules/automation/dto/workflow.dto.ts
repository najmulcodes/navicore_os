import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class WorkflowActionDto {
  @IsInt() @Min(0) order!: number;
  @IsIn(["CREATE_TASK", "SEND_WEBHOOK", "CREATE_NOTIFICATION"])
  actionType!: "CREATE_TASK" | "SEND_WEBHOOK" | "CREATE_NOTIFICATION";
  @IsObject() config!: Record<string, unknown>;
}

export class CreateWorkflowDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() triggerEntityType!: string;
  @IsString() @IsNotEmpty() triggerAction!: string;
  @IsOptional() @IsObject() conditions?: Record<string, unknown>;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions!: WorkflowActionDto[];
}

export class UpdateWorkflowDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
}
