import { ApiProperty } from '@nestjs/swagger';
import { ClassStudentListItemDto } from './class-student-list-item.dto';

export class ClassRosterResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ type: [ClassStudentListItemDto] })
  students: ClassStudentListItemDto[];

  static fromData(input: {
    classId: string;
    students: ClassStudentListItemDto[];
  }): ClassRosterResponseDto {
    const dto = new ClassRosterResponseDto();
    dto.classId = input.classId;
    dto.students = [...input.students].sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
    return dto;
  }
}
