import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class VerifyEmailResponseDto {
  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ type: UserProfileResponse })
  user: UserProfileResponse;

  static fromData(data: {
    emailVerified: boolean;
    user: UserProfileResponse;
  }): VerifyEmailResponseDto {
    const dto = new VerifyEmailResponseDto();
    dto.emailVerified = data.emailVerified;
    dto.user = data.user;
    return dto;
  }
}
