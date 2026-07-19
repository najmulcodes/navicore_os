import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateKnowledgeArticleDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsString() @IsNotEmpty() content!: string;
}

export class UpdateKnowledgeArticleDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsString() content?: string;
}
