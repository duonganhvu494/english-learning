import { ApiProperty } from '@nestjs/swagger';
import { ClassStudent } from '../entities/class-student.entity';

export class ClassStudentListItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  fullName: string;

  @ApiProperty({ example: 'student01' })
  userName: string;

  @ApiProperty({ example: 'student01@example.com' })
  email: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440300',
    nullable: true,
  })
  classRoleId: string | null;

  @ApiProperty({ example: 'assistant', nullable: true })
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
