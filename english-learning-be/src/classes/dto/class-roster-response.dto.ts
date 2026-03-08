import { ClassStudentListItemDto } from './class-student-list-item.dto';

export class ClassRosterResponseDto {
  classId: string;
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
