import { IsString, IsUUID } from 'class-validator';

export class AbortMaterialUploadDto {
  @IsUUID('4', { message: 'materialId must be a valid UUID' })
  materialId: string;

  @IsUUID('4', { message: 'uploadSessionId must be a valid UUID' })
  uploadSessionId: string;

  @IsString({ message: 'uploadId must be a string' })
  uploadId: string;

  @IsString({ message: 'objectKey must be a string' })
  objectKey: string;
}
