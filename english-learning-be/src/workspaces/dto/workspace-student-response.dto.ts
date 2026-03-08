import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class WorkspaceStudentResponseDto {
  workspaceId: string;
  role: string;
  plainPassword: string;
  user: UserProfileResponse;

  static fromData(input: {
    workspaceId: string;
    role: string;
    plainPassword: string;
    user: UserProfileResponse;
  }): WorkspaceStudentResponseDto {
    const dto = new WorkspaceStudentResponseDto();
    dto.workspaceId = input.workspaceId;
    dto.role = input.role;
    dto.plainPassword = input.plainPassword;
    dto.user = input.user;
    return dto;
  }
}
