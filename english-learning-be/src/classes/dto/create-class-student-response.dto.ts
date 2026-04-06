import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import type { StudentProvisioningMode } from 'src/workspaces/types/student-provisioning-mode.type';

export class CreateClassStudentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ enum: ['created', 'attached', 'already_assigned'] })
  mode: StudentProvisioningMode;

  @ApiProperty({ example: 'student' })
  workspaceRole: string;

  @ApiProperty({ example: 'student' })
  classRoleName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440300' })
  classRoleId: string;

  @ApiProperty({ type: UserProfileResponse })
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
