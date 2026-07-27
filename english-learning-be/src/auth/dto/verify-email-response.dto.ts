import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class VerifyEmailResponseDto {
  emailVerified: boolean;

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
