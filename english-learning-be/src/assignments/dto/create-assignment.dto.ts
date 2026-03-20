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
import { AssignmentType } from '../entities/assignment.entity';

export class CreateAssignmentDto {
  @IsString({ message: 'title must be a string' })
  @MaxLength(255, { message: 'title is too long' })
  title: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsDateString({}, { message: 'timeStart must be a valid ISO date string' })
  timeStart: string;

  @IsDateString({}, { message: 'timeEnd must be a valid ISO date string' })
  timeEnd: string;

  @IsOptional()
  @IsEnum(AssignmentType, { message: 'type is invalid' })
  type?: AssignmentType;

  @IsOptional()
  @IsArray({ message: 'materialIds must be an array' })
  @ArrayUnique({ message: 'materialIds contains duplicate values' })
  @IsUUID('4', {
    each: true,
    message: 'each materialId must be a valid UUID',
  })
  materialIds?: string[];
}
