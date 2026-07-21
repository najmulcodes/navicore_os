import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendChatMessageDto {
  @IsString() @IsNotEmpty() content!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) mentionedUserIds?: string[];
}
