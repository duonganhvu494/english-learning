import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssignmentQuizQuestionDto {
  @IsString({ message: 'content must be a string' })
  @MaxLength(5000, { message: 'content is too long' })
  content: string;

  @IsOptional()
  @IsNumber({}, { message: 'points must be a number' })
  @Min(0, { message: 'points must be greater than or equal to 0' })
  points?: number;

  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer' })
  @Min(0, { message: 'sortOrder must be greater than or equal to 0' })
  sortOrder?: number;

  @IsOptional()
  @IsUUID('4', { message: 'materialId must be a valid UUID' })
  materialId?: string;
}
