import { ApiProperty } from '@nestjs/swagger';
import { LectureEntity } from '../entities/lecture.entity';
import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';

export class LectureResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440600' })
  id: string;

  @ApiProperty({ example: 'LEC-001', nullable: true })
  code: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440400' })
  sessionId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ example: 'Present Simple Overview' })
  title: string;

  @ApiProperty({
    example: 'Introduction and examples for present simple tense',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ type: [MaterialSummaryDto] })
  materials: MaterialSummaryDto[];

  @ApiProperty({ example: '2026-03-22T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-22T08:30:00.000Z' })
  updatedAt: Date;

  static fromEntity(lecture: LectureEntity): LectureResponseDto {
    const dto = new LectureResponseDto();
    dto.id = lecture.id;
    dto.code = lecture.code;
    dto.sessionId = lecture.session.id;
    dto.classId = lecture.session.classEntity.id;
    dto.title = lecture.title;
    dto.description = lecture.description;
    dto.materials = (lecture.lectureMaterials ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((lectureMaterial) =>
        MaterialSummaryDto.fromEntity(lectureMaterial.material, lecture.id),
      );
    dto.createdAt = lecture.createdAt;
    dto.updatedAt = lecture.updatedAt;
    return dto;
  }
}
