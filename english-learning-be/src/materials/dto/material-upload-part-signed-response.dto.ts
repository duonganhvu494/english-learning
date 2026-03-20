export class MaterialUploadPartSignedResponseDto {
  partNumber: number;
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
