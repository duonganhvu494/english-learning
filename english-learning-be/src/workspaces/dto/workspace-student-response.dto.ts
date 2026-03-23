import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class WorkspaceStudentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: 'student' })
  role: string;

  @ApiProperty({
    example: 'temp-pass-493',
    description: 'Temporary password issued for the newly created student account',
  })
  plainPassword: string;

  @ApiProperty({ type: UserProfileResponse })
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
