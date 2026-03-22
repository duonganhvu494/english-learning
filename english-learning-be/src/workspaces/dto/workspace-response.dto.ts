// src/workspaces/dto/workspace-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Workspace } from '../entities/workspace.entity';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class WorkspaceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  id: string;

  @ApiProperty({ example: 'English Center Alpha' })
  name: string;

  @ApiProperty({ type: UserProfileResponse })
  owner: UserProfileResponse;

  static fromEntity(workspace: Workspace): WorkspaceResponseDto {
    const dto = new WorkspaceResponseDto();
    dto.id = workspace.id;
    dto.name = workspace.name;
    dto.owner = UserProfileResponse.fromEntity(workspace.owner);
    return dto;
  }
}
