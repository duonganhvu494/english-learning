import { ApiProperty } from '@nestjs/swagger';

export class MaterialUploadInitResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440500' })
  materialId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440700' })
  uploadSessionId: string;

  @ApiProperty({ example: '2~QmF0Y2hVcGxvYWRJZA...' })
  uploadId: string;

  @ApiProperty({ example: 'workspaces/550e8400/materials/lesson-1-slides.pdf' })
  objectKey: string;

  @ApiProperty({ example: 10485760 })
  partSize: number;

  @ApiProperty({ example: 3 })
  totalParts: number;

  @ApiProperty({ example: '2026-03-23T08:00:00.000Z' })
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
