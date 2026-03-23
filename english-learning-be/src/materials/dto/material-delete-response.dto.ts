import { ApiProperty } from '@nestjs/swagger';

export class MaterialDeleteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440500' })
  materialId: string;

  static fromData(input: { materialId: string }): MaterialDeleteResponseDto {
    const dto = new MaterialDeleteResponseDto();
    dto.materialId = input.materialId;
    return dto;
  }
}
