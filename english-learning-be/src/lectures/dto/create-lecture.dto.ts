import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateLectureDto {
  @IsString({ message: 'title must be a string' })
  @MaxLength(255, { message: 'title is too long' })
  title: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'materialIds must be an array' })
  @ArrayUnique({ message: 'materialIds contains duplicate values' })
  @IsUUID('4', {
    each: true,
    message: 'each materialId must be a valid UUID',
  })
  materialIds?: string[];
}
