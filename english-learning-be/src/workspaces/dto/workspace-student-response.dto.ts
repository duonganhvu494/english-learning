import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import type { StudentProvisioningMode } from '../types/student-provisioning-mode.type';

export class WorkspaceStudentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ enum: ['created', 'attached', 'already_assigned'] })
  mode: StudentProvisioningMode;

  @ApiProperty({ example: 'student' })
  role: string;

  @ApiProperty({ type: UserProfileResponse })
  user: UserProfileResponse;

  static fromData(input: {
    workspaceId: string;
    mode: StudentProvisioningMode;
    role: string;
    user: UserProfileResponse;
  }): WorkspaceStudentResponseDto {
    const dto = new WorkspaceStudentResponseDto();
    dto.workspaceId = input.workspaceId;
    dto.mode = input.mode;
    dto.role = input.role;
    dto.user = input.user;
    return dto;
  }
}
