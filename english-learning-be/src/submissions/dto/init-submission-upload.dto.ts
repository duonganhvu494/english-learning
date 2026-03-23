import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitSubmissionUploadDto {
  @ApiProperty({
    example: 'essay-final.docx',
    description: 'Original submission file name',
  })
  @IsString({ message: 'fileName must be a string' })
  @MaxLength(255, { message: 'fileName is too long' })
  fileName: string;

  @ApiProperty({
    example: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Submission file MIME type',
  })
  @IsString({ message: 'mimeType must be a string' })
  @IsNotEmpty({ message: 'mimeType can not be empty' })
  @MaxLength(255, { message: 'mimeType is too long' })
  mimeType: string;

  @ApiProperty({
    example: 2097152,
    description: 'Submission file size in bytes',
    minimum: 1,
  })
  @IsInt({ message: 'size must be an integer' })
  @Min(1, { message: 'size must be greater than 0' })
  size: number;
}
