import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CompleteMaterialUploadPartDto {
  @IsInt({ message: 'partNumber must be an integer' })
  @Min(1, { message: 'partNumber must be greater than 0' })
  partNumber: number;

  @IsString({ message: 'etag must be a string' })
  etag: string;
}

export class CompleteMaterialUploadDto {
  @IsUUID('4', { message: 'materialId must be a valid UUID' })
  materialId: string;

  @IsUUID('4', { message: 'uploadSessionId must be a valid UUID' })
  uploadSessionId: string;

  @IsString({ message: 'uploadId must be a string' })
  uploadId: string;

  @IsString({ message: 'objectKey must be a string' })
  objectKey: string;

  @IsArray({ message: 'parts must be an array' })
  @ArrayMinSize(1, { message: 'parts must not be empty' })
  @ArrayUnique((part: CompleteMaterialUploadPartDto) => part.partNumber, {
    message: 'parts contains duplicate partNumber values',
  })
  @ValidateNested({ each: true })
  @Type(() => CompleteMaterialUploadPartDto)
  parts: CompleteMaterialUploadPartDto[];
}
