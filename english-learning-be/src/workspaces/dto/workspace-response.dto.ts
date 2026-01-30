// src/workspaces/dto/workspace-response.dto.ts
import { Workspace } from '../entities/workspace.entity';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class WorkspaceResponseDto {
  id: string;
  name: string;
  owner: UserProfileResponse;

  static fromEntity(workspace: Workspace): WorkspaceResponseDto {
    const dto = new WorkspaceResponseDto();
    dto.id = workspace.id;
    dto.name = workspace.name;
    dto.owner = UserProfileResponse.fromEntity(workspace.owner);
    return dto;
  }
}
