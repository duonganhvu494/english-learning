import { Material } from '../entities/material.entity';

export class MaterialResponseDto {
  id: string;
  workspaceId: string;
  title: string;
  downloadUrl: string;
  status: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  category: string;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(material: Material): MaterialResponseDto {
    const dto = new MaterialResponseDto();
    dto.id = material.id;
    dto.workspaceId = material.workspace.id;
    dto.title = material.title;
    dto.downloadUrl = `/materials/${material.id}/download`;
    dto.status = material.status;
    dto.fileName = material.fileName;
    dto.mimeType = material.mimeType;
    dto.size = material.size;
    dto.category = material.category;
    dto.uploadedBy = material.uploadedBy?.id ?? null;
    dto.createdAt = material.createdAt;
    dto.updatedAt = material.updatedAt;
    return dto;
  }
}
