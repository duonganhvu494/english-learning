import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartBillingSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  planCode: string;
}
