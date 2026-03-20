import { LectureEntity } from '../entities/lecture.entity';
import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';

export class LectureResponseDto {
  id: string;
  sessionId: string;
  classId: string;
  title: string;
  description: string | null;
  materials: MaterialSummaryDto[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(lecture: LectureEntity): LectureResponseDto {
    const dto = new LectureResponseDto();
    dto.id = lecture.id;
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
