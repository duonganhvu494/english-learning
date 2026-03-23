import { ApiProperty } from '@nestjs/swagger';
import { Material } from '../entities/material.entity';
import { MaterialCategory, MaterialStatus } from '../entities/material.entity';

export class MaterialResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440500' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: 'Lesson 1 Slides' })
  title: string;

  @ApiProperty({ example: '/materials/550e8400-e29b-41d4-a716-446655440500/download' })
  downloadUrl: string;

  @ApiProperty({ enum: MaterialStatus, example: MaterialStatus.READY })
  status: string;

  @ApiProperty({ example: 'lesson-1-slides.pdf' })
  fileName: string;

  @ApiProperty({ example: 'application/pdf', nullable: true })
  mimeType: string | null;

  @ApiProperty({ example: 248321, nullable: true })
  size: number | null;

  @ApiProperty({ enum: MaterialCategory, example: MaterialCategory.LECTURE })
  category: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  uploadedBy: string | null;

  @ApiProperty({ example: '2026-03-22T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-22T08:05:00.000Z' })
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
