import { IsInt, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignMaterialUploadPartDto {
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
    example: 1,
    description: 'Part number to sign',
    minimum: 1,
  })
  @IsInt({ message: 'partNumber must be an integer' })
  @Min(1, { message: 'partNumber must be greater than 0' })
  partNumber: number;
}
