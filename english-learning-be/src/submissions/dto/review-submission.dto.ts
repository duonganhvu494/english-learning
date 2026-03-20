import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReviewSubmissionDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'grade must be a number' })
  @Min(0, { message: 'grade must be greater than or equal to 0' })
  grade?: number;

  @IsOptional()
  @IsString({ message: 'feedback must be a string' })
  feedback?: string;
}
