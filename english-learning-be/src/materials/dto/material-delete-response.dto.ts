export class MaterialDeleteResponseDto {
  materialId: string;

  static fromData(input: { materialId: string }): MaterialDeleteResponseDto {
    const dto = new MaterialDeleteResponseDto();
    dto.materialId = input.materialId;
    return dto;
  }
}
