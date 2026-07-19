import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must be lowercase letters, numbers, and hyphens only" })
  @MaxLength(60)
  slug!: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;
}

export class AddWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsIn(["Owner", "Admin", "Member", "Guest"])
  role!: string;
}

export class UpdateWorkspaceMemberDto {
  @IsString()
  @IsIn(["Owner", "Admin", "Member", "Guest"])
  role!: string;
}
