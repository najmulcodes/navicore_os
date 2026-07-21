import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateChannelDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsOptional() @IsBoolean() isPrivate?: boolean;
}
