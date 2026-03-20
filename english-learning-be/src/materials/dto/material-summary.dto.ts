import { Material } from '../entities/material.entity';

export class MaterialSummaryDto {
  id: string;
  title: string;
  downloadUrl: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  category: string;

  static fromEntity(
    material: Material,
    downloadUrl: string,
  ): MaterialSummaryDto {
    const dto = new MaterialSummaryDto();
    dto.id = material.id;
    dto.title = material.title;
    dto.downloadUrl = downloadUrl;
    dto.fileName = material.fileName;
    dto.mimeType = material.mimeType;
    dto.size = material.size;
    dto.category = material.category;
    return dto;
  }
}
