import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class InitSubmissionUploadDto {
  @IsString({ message: 'fileName must be a string' })
  @MaxLength(255, { message: 'fileName is too long' })
  fileName: string;

  @IsString({ message: 'mimeType must be a string' })
  @IsNotEmpty({ message: 'mimeType can not be empty' })
  @MaxLength(255, { message: 'mimeType is too long' })
  mimeType: string;

  @IsInt({ message: 'size must be an integer' })
  @Min(1, { message: 'size must be greater than 0' })
  size: number;
}
