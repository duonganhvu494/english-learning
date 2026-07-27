import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import type { StudentProvisioningMode } from 'src/workspaces/types/student-provisioning-mode.type';

export class CreateClassStudentResponseDto {
  classId: string;

  workspaceId: string;

  mode: StudentProvisioningMode;

  workspaceRole: string;

  classRoleName: string;

  classRoleId: string;

  user: UserProfileResponse;

  static fromData(input: {
    classId: string;
    workspaceId: string;
    mode: StudentProvisioningMode;
    workspaceRole: string;
    classRoleId: string;
    classRoleName: string;
    user: UserProfileResponse;
  }): CreateClassStudentResponseDto {
    const dto = new CreateClassStudentResponseDto();
    dto.classId = input.classId;
    dto.workspaceId = input.workspaceId;
    dto.mode = input.mode;
    dto.workspaceRole = input.workspaceRole;
    dto.classRoleId = input.classRoleId;
    dto.classRoleName = input.classRoleName;
    dto.user = input.user;
    return dto;
  }
}
