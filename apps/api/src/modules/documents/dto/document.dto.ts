import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDocumentDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() folderId?: string;
  @IsString() @IsNotEmpty() content!: string; // first version's content
}

export class CreateDocumentVersionDto {
  @IsString() @IsNotEmpty() content!: string;
}

export class ReviewApprovalDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";
}
