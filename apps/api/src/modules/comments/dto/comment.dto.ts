import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum CommentableTypeDto {
  TASK = "TASK",
  DEAL = "DEAL",
  DOCUMENT = "DOCUMENT",
}

export class CreateCommentDto {
  @IsEnum(CommentableTypeDto)
  entityType!: CommentableTypeDto;

  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
