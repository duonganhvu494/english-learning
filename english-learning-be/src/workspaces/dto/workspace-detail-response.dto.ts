import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import { Workspace } from '../entities/workspace.entity';

export class WorkspaceDetailResponseDto {
  id: string;
  name: string;
  owner: UserProfileResponse;
  isActive: boolean;
  currentUserRole: string;
  studentCount: number;
  classCount: number;

  static fromData(input: {
    workspace: Workspace;
    currentUserRole: string;
    studentCount: number;
    classCount: number;
  }): WorkspaceDetailResponseDto {
    const dto = new WorkspaceDetailResponseDto();
    dto.id = input.workspace.id;
    dto.name = input.workspace.name;
    dto.owner = UserProfileResponse.fromEntity(input.workspace.owner);
    dto.isActive = input.workspace.isActive;
    dto.currentUserRole = input.currentUserRole;
    dto.studentCount = input.studentCount;
    dto.classCount = input.classCount;
    return dto;
  }
}
