import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLectureDto {
  @ApiProperty({
    example: 'Present Simple Overview',
    description: 'Lecture title',
  })
  @IsString({ message: 'title must be a string' })
  @MaxLength(255, { message: 'title is too long' })
  title: string;

  @ApiPropertyOptional({
    example: 'Introduction and examples for present simple tense',
    description: 'Lecture description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440500'],
    description: 'Ordered list of material IDs attached to the lecture',
  })
  @IsOptional()
  @IsArray({ message: 'materialIds must be an array' })
  @ArrayUnique({ message: 'materialIds contains duplicate values' })
  @IsUUID('4', {
    each: true,
    message: 'each materialId must be a valid UUID',
  })
  materialIds?: string[];
}
