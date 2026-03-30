import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class CreateClassStudentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: 'student' })
  workspaceRole: string;

  @ApiProperty({ example: 'student' })
  classRoleName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440300' })
  classRoleId: string;

  @ApiProperty({
    example: 'temp-pass-493',
    description: 'Temporary password issued for the newly created student account',
  })
  plainPassword: string;

  @ApiProperty({ type: UserProfileResponse })
  user: UserProfileResponse;

  static fromData(input: {
    classId: string;
    workspaceId: string;
    workspaceRole: string;
    classRoleId: string;
    classRoleName: string;
    plainPassword: string;
    user: UserProfileResponse;
  }): CreateClassStudentResponseDto {
    const dto = new CreateClassStudentResponseDto();
    dto.classId = input.classId;
    dto.workspaceId = input.workspaceId;
    dto.workspaceRole = input.workspaceRole;
    dto.classRoleId = input.classRoleId;
    dto.classRoleName = input.classRoleName;
    dto.plainPassword = input.plainPassword;
    dto.user = input.user;
    return dto;
  }
}
