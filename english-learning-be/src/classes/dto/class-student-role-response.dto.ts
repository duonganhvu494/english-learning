import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/rbac/entities/role.entity';

export class ClassStudentRoleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440300',
    nullable: true,
  })
  roleId: string | null;

  @ApiProperty({ example: 'assistant', nullable: true })
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
