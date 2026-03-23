import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialCategory } from '../entities/material.entity';

export class InitMaterialUploadDto {
  @ApiPropertyOptional({
    example: 'Lesson 01 Slides',
    description: 'Optional title shown in the material library',
  })
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  @MaxLength(255, { message: 'title is too long' })
  title?: string;

  @ApiProperty({
    example: 'lesson-01.pdf',
    description: 'Original file name',
  })
  @IsString({ message: 'fileName must be a string' })
  @MaxLength(255, { message: 'fileName is too long' })
  fileName: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type of the uploaded file',
  })
  @IsString({ message: 'mimeType must be a string' })
  @IsNotEmpty({ message: 'mimeType can not be empty' })
  @MaxLength(255, { message: 'mimeType is too long' })
  mimeType: string;

  @ApiProperty({
    example: 1048576,
    description: 'File size in bytes',
    minimum: 1,
  })
  @IsInt({ message: 'size must be an integer' })
  @Min(1, { message: 'size must be greater than 0' })
  size: number;

  @ApiPropertyOptional({
    enum: MaterialCategory,
    example: MaterialCategory.GENERAL,
    description: 'Optional material category',
  })
  @IsOptional()
  @IsEnum(MaterialCategory, { message: 'category is invalid' })
  category?: MaterialCategory;
}
