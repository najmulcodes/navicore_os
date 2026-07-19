import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateCompanyDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() industry?: string;
}
export class UpdateCompanyDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() industry?: string;
}

export class CreateContactDto {
  @IsOptional() @IsString() companyId?: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
}
export class UpdateContactDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() @IsNotEmpty() firstName?: string;
  @IsOptional() @IsString() @IsNotEmpty() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
}

export class CreatePipelineStageDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsInt() @Min(0) order!: number;
  @IsOptional() @IsInt() @Min(0) probability?: number;
}

export class CreateDealDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsString() @IsNotEmpty() stageId!: string;
  @IsOptional() @IsInt() @Min(0) valueCents?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsDateString() expectedCloseDate?: string;
}
export class UpdateDealDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsInt() @Min(0) valueCents?: number;
  @IsOptional() @IsDateString() expectedCloseDate?: string;
  @IsOptional() @IsIn(["OPEN", "WON", "LOST"]) status?: "OPEN" | "WON" | "LOST";
}
export class MoveDealStageDto {
  @IsString() @IsNotEmpty() stageId!: string;
}
