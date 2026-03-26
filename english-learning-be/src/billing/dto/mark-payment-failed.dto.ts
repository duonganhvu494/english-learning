import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPaymentFailedDto {
  @ApiPropertyOptional({
    example: 'Card declined',
    description: 'Optional mock failure reason to persist on the transaction',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  failureReason?: string;
}
