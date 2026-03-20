export class MaterialUploadInitResponseDto {
  materialId: string;
  uploadSessionId: string;
  uploadId: string;
  objectKey: string;
  partSize: number;
  totalParts: number;
  expiresAt: Date;

  static fromData(input: {
    materialId: string;
    uploadSessionId: string;
    uploadId: string;
    objectKey: string;
    partSize: number;
    totalParts: number;
    expiresAt: Date;
  }): MaterialUploadInitResponseDto {
    const dto = new MaterialUploadInitResponseDto();
    dto.materialId = input.materialId;
    dto.uploadSessionId = input.uploadSessionId;
    dto.uploadId = input.uploadId;
    dto.objectKey = input.objectKey;
    dto.partSize = input.partSize;
    dto.totalParts = input.totalParts;
    dto.expiresAt = input.expiresAt;
    return dto;
  }
}
