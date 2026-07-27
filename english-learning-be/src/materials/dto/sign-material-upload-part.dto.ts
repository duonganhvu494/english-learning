import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class SignMaterialUploadPartDto {
  @IsUUID('4', { message: 'materialId must be a valid UUID' })
  materialId: string;

  @IsUUID('4', { message: 'uploadSessionId must be a valid UUID' })
  uploadSessionId: string;

  @IsString({ message: 'uploadId must be a string' })
  uploadId: string;

  @IsString({ message: 'objectKey must be a string' })
  objectKey: string;

  @IsInt({ message: 'partNumber must be an integer' })
  @Min(1, { message: 'partNumber must be greater than 0' })
  partNumber: number;
}
