import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import type { StudentProvisioningMode } from '../types/student-provisioning-mode.type';

export class WorkspaceStudentResponseDto {
  workspaceId: string;

  mode: StudentProvisioningMode;

  role: string;

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
