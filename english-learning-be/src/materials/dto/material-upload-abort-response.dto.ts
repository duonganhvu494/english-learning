export class MaterialUploadAbortResponseDto {
  materialId: string;
  uploadSessionId: string;
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
