import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class ResetPasswordResponseDto {
  @ApiProperty({ type: UserProfileResponse })
  user: UserProfileResponse;

  static fromData(data: { user: UserProfileResponse }): ResetPasswordResponseDto {
    const dto = new ResetPasswordResponseDto();
    dto.user = data.user;
    return dto;
  }
}
