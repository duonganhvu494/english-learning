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
import { ApiProperty } from '@nestjs/swagger';

class CompleteMaterialUploadPartDto {
  @ApiProperty({
    example: 1,
    description: 'Completed multipart upload part number',
    minimum: 1,
  })
  @IsInt({ message: 'partNumber must be an integer' })
  @Min(1, { message: 'partNumber must be greater than 0' })
  partNumber: number;

  @ApiProperty({
    example: '"8f1c1d8b6a..."',
    description: 'ETag returned by S3 after uploading the part',
  })
  @IsString({ message: 'etag must be a string' })
  etag: string;
}

export class CompleteMaterialUploadDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Material ID returned from upload-init',
  })
  @IsUUID('4', { message: 'materialId must be a valid UUID' })
  materialId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Upload session ID returned from upload-init',
  })
  @IsUUID('4', { message: 'uploadSessionId must be a valid UUID' })
  uploadSessionId: string;

  @ApiProperty({
    example: '2~abc123...',
    description: 'Multipart upload ID returned from upload-init',
  })
  @IsString({ message: 'uploadId must be a string' })
  uploadId: string;

  @ApiProperty({
    example: 'workspaces/<workspace-id>/materials/<uuid>.pdf',
    description: 'S3 object key returned from upload-init',
  })
  @IsString({ message: 'objectKey must be a string' })
  objectKey: string;

  @ApiProperty({
    description: 'Uploaded parts with S3 ETag values',
    type: [CompleteMaterialUploadPartDto],
  })
  @IsArray({ message: 'parts must be an array' })
  @ArrayMinSize(1, { message: 'parts must not be empty' })
  @ArrayUnique((part: CompleteMaterialUploadPartDto) => part.partNumber, {
    message: 'parts contains duplicate partNumber values',
  })
  @ValidateNested({ each: true })
  @Type(() => CompleteMaterialUploadPartDto)
  parts: CompleteMaterialUploadPartDto[];
}
