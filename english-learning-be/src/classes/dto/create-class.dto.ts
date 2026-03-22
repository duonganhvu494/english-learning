import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    example: 'IELTS Foundation - Batch 01',
    description: 'Class name',
  })
  @IsString({ message: 'className must be a string' })
  @IsNotEmpty({ message: 'className can not be empty' })
  @MaxLength(100, { message: 'className is too long' })
  className: string;

  @ApiPropertyOptional({
    example: 'Evening class for IELTS foundation students',
    description: 'Optional class description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(255, { message: 'description is too long' })
  description?: string;
}
