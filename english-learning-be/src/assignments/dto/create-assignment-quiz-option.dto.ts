import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssignmentQuizOptionDto {
  @IsString({ message: 'content must be a string' })
  @MaxLength(2000, { message: 'content is too long' })
  content: string;

  @IsOptional()
  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect?: boolean;

  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer' })
  @Min(0, { message: 'sortOrder must be greater than or equal to 0' })
  sortOrder?: number;
}
