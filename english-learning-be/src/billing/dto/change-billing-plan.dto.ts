import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class ChangeBillingPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  planCode: string;
}
