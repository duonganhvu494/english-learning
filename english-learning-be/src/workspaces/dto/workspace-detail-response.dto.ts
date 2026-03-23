import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import { Workspace } from '../entities/workspace.entity';

export class WorkspaceDetailResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  id: string;

  @ApiProperty({ example: 'English Center Alpha' })
  name: string;

  @ApiProperty({ type: UserProfileResponse })
  owner: UserProfileResponse;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'owner' })
  currentUserRole: string;

  @ApiProperty({ example: 28 })
  studentCount: number;

  @ApiProperty({ example: 4 })
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
