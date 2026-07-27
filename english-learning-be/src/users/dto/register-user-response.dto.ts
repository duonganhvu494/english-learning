import { User } from '../entities/user.entity';
import { UserResponseDto } from './user-response.dto';

export class RegisterUserResponseDto {
  user: UserResponseDto;

  emailVerificationRequired: boolean;

  emailVerificationExpiresAt: string;

  static fromData(data: {
    user: User;
    emailVerificationRequired: boolean;
    emailVerificationExpiresAt: Date;
  }): RegisterUserResponseDto {
    const dto = new RegisterUserResponseDto();
    dto.user = UserResponseDto.fromEntity(data.user);
    dto.emailVerificationRequired = data.emailVerificationRequired;
    dto.emailVerificationExpiresAt = data.emailVerificationExpiresAt.toISOString();
    return dto;
  }
}
