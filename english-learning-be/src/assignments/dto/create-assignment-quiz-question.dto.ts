import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentQuizQuestionDto {
  @ApiProperty({
    example: 'Which sentence uses the correct tense?',
    description: 'Question content',
  })
  @IsString({ message: 'content must be a string' })
  @MaxLength(5000, { message: 'content is too long' })
  content: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Question points',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'points must be a number' })
  @Min(0, { message: 'points must be greater than or equal to 0' })
  points?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order inside the quiz',
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer' })
  @Min(0, { message: 'sortOrder must be greater than or equal to 0' })
  sortOrder?: number;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Optional material attached to the quiz question',
  })
  @IsOptional()
  @IsUUID('4', { message: 'materialId must be a valid UUID' })
  materialId?: string;
}
