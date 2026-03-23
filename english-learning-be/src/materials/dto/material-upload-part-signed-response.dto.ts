import { ApiProperty } from '@nestjs/swagger';

export class MaterialUploadPartSignedResponseDto {
  @ApiProperty({ example: 1 })
  partNumber: number;

  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/...signed-url...' })
  url: string;

  static fromData(input: {
    partNumber: number;
    url: string;
  }): MaterialUploadPartSignedResponseDto {
    const dto = new MaterialUploadPartSignedResponseDto();
    dto.partNumber = input.partNumber;
    dto.url = input.url;
    return dto;
  }
}
