import { ApiProperty } from '@nestjs/swagger';
import { ClassEntity } from '../entities/class.entity';

type ClassResponseSource = ClassEntity & {
  studentCount?: number;
};

export class ClassResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  id: string;

  @ApiProperty({ example: 'Basic English 101' })
  className: string;

  @ApiProperty({
    example: 'Foundation class for beginner students',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: 15 })
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
