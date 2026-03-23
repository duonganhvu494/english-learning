import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewSubmissionDto {
  @ApiPropertyOptional({
    example: 8.5,
    description: 'Optional score assigned to the submission',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'grade must be a number' })
  @Min(0, { message: 'grade must be greater than or equal to 0' })
  grade?: number;

  @ApiPropertyOptional({
    example: 'Good structure. Improve grammar in the second paragraph.',
    description: 'Optional teacher feedback',
  })
  @IsOptional()
  @IsString({ message: 'feedback must be a string' })
  feedback?: string;
}
