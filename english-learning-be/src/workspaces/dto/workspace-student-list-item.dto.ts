import { WorkspaceMember } from '../entities/workspace-member.entity';

export class WorkspaceStudentListItemDto {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  role: string;
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
