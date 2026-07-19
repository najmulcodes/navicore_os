import { IsString, IsNotEmpty } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString() @IsNotEmpty() planKey!: string;
  @IsString() @IsNotEmpty() successUrl!: string;
  @IsString() @IsNotEmpty() cancelUrl!: string;
}
