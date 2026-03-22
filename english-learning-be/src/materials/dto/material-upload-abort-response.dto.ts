import { ApiProperty } from '@nestjs/swagger';

export class MaterialUploadAbortResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440500' })
  materialId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440700' })
  uploadSessionId: string;

  @ApiProperty({ example: 'failed' })
  status: string;

  static fromData(input: {
    materialId: string;
    uploadSessionId: string;
    status: string;
  }): MaterialUploadAbortResponseDto {
    const dto = new MaterialUploadAbortResponseDto();
    dto.materialId = input.materialId;
    dto.uploadSessionId = input.uploadSessionId;
    dto.status = input.status;
    return dto;
  }
}
