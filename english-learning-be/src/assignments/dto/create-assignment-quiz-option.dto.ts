import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentQuizOptionDto {
  @ApiProperty({
    example: 'She has gone to school.',
    description: 'Option content',
  })
  @IsString({ message: 'content must be a string' })
  @MaxLength(2000, { message: 'content is too long' })
  content: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Marks whether this option is correct',
  })
  @IsOptional()
  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order inside the options list',
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer' })
  @Min(0, { message: 'sortOrder must be greater than or equal to 0' })
  sortOrder?: number;
}
