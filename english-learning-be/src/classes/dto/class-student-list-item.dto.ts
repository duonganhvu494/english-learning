import { ClassStudent } from '../entities/class-student.entity';

export class ClassStudentListItemDto {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  classRoleId: string | null;
  classRoleName: string | null;

  static fromEntity(classStudent: ClassStudent): ClassStudentListItemDto {
    const dto = new ClassStudentListItemDto();
    dto.studentId = classStudent.student.id;
    dto.fullName = classStudent.student.fullName;
    dto.userName = classStudent.student.userName;
    dto.email = classStudent.student.email;
    dto.classRoleId = classStudent.role?.id ?? null;
    dto.classRoleName = classStudent.role?.name ?? null;
    return dto;
  }
}
