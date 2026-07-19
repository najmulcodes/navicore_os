import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateConversationDto {
  @IsOptional() @IsString() title?: string;
}

export class SendMessageDto {
  @IsString() @IsNotEmpty() content!: string;
}

export class SummarizeDto {
  @IsString() @IsNotEmpty() text!: string;
}
