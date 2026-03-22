import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceMember } from '../entities/workspace-member.entity';

export class WorkspaceStudentListItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  fullName: string;

  @ApiProperty({ example: 'student01' })
  userName: string;

  @ApiProperty({ example: 'student01@example.com' })
  email: string;

  @ApiProperty({ example: 'student' })
  role: string;

  @ApiProperty({ example: 'active' })
  status: string;

  static fromEntity(member: WorkspaceMember): WorkspaceStudentListItemDto {
    const dto = new WorkspaceStudentListItemDto();
    dto.studentId = member.user.id;
    dto.fullName = member.user.fullName;
    dto.userName = member.user.userName;
    dto.email = member.user.email;
    dto.role = member.role.name;
    dto.status = member.status;
    return dto;
  }
}
