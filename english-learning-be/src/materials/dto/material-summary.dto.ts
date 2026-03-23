import { ApiProperty } from '@nestjs/swagger';
import { Material } from '../entities/material.entity';
import { MaterialCategory } from '../entities/material.entity';

export class MaterialSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440500' })
  id: string;

  @ApiProperty({ example: 'Lesson 1 Slides' })
  title: string;

  @ApiProperty({
    example: '/lectures/550e8400-e29b-41d4-a716-446655440600/materials/550e8400-e29b-41d4-a716-446655440500/download',
  })
  downloadUrl: string;

  @ApiProperty({ example: 'lesson-1-slides.pdf' })
  fileName: string;

  @ApiProperty({ example: 'application/pdf', nullable: true })
  mimeType: string | null;

  @ApiProperty({ example: 248321, nullable: true })
  size: number | null;

  @ApiProperty({ enum: MaterialCategory, example: MaterialCategory.LECTURE })
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
