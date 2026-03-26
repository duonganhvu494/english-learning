import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartBillingSubscriptionDto {
  @ApiProperty({
    example: 'starter',
    description: 'Plan code to start as a paid recurring monthly subscription',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  planCode: string;
}
