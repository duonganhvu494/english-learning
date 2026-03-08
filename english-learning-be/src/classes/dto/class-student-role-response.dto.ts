import { Role } from 'src/rbac/entities/role.entity';

export class ClassStudentRoleResponseDto {
  classId: string;
  studentId: string;
  roleId: string | null;
  roleName: string | null;

  static fromData(input: {
    classId: string;
    studentId: string;
    role: Role | null;
  }): ClassStudentRoleResponseDto {
    const dto = new ClassStudentRoleResponseDto();
    dto.classId = input.classId;
    dto.studentId = input.studentId;
    dto.roleId = input.role?.id ?? null;
    dto.roleName = input.role?.name ?? null;
    return dto;
  }
}
