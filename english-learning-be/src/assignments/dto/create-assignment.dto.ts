import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentType } from '../entities/assignment.entity';

export class CreateAssignmentDto {
  @ApiProperty({
    example: 'Homework 01',
    description: 'Assignment title',
  })
  @IsString({ message: 'title must be a string' })
  @MaxLength(255, { message: 'title is too long' })
  title: string;

  @ApiPropertyOptional({
    example: 'Write a short essay about your hometown.',
    description: 'Optional assignment description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiProperty({
    example: '2026-03-22T08:00:00.000Z',
    description: 'Assignment opening time in ISO 8601 format',
  })
  @IsDateString({}, { message: 'timeStart must be a valid ISO date string' })
  timeStart: string;

  @ApiProperty({
    example: '2026-03-25T23:59:59.000Z',
    description: 'Assignment closing time in ISO 8601 format',
  })
  @IsDateString({}, { message: 'timeEnd must be a valid ISO date string' })
  timeEnd: string;

  @ApiPropertyOptional({
    enum: AssignmentType,
    example: AssignmentType.MANUAL,
    description: 'Assignment type. Defaults to manual when omitted.',
  })
  @IsOptional()
  @IsEnum(AssignmentType, { message: 'type is invalid' })
  type?: AssignmentType;

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'Optional material IDs attached to the assignment',
    type: [String],
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
