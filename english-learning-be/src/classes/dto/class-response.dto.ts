import { ClassEntity } from '../entities/class.entity';

type ClassResponseSource = ClassEntity & {
  studentCount?: number;
};

export class ClassResponseDto {
  id: string;
  className: string;
  description: string | null;
  workspaceId: string;
  studentCount: number;

  static fromEntity(classEntity: ClassResponseSource): ClassResponseDto {
    const dto = new ClassResponseDto();
    dto.id = classEntity.id;
    dto.className = classEntity.className;
    dto.description = classEntity.description ?? null;
    dto.workspaceId = classEntity.workspace.id;
    dto.studentCount =
      classEntity.studentCount ?? classEntity.classStudents?.length ?? 0;
    return dto;
  }
}
