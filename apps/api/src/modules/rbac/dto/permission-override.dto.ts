import { IsNotEmpty, IsString } from "class-validator";

export class GrantPermissionOverrideDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsString() @IsNotEmpty() resourceType!: string;
  @IsString() @IsNotEmpty() resourceId!: string;
  @IsString() @IsNotEmpty() permissionKey!: string;
}
