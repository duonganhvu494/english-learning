import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserResponseDto } from './user-response.dto';

export class RegisterUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ example: true })
  emailVerificationRequired: boolean;

  @ApiProperty({
    example: '2026-04-06T10:15:00.000Z',
    description: 'UTC timestamp when the verification OTP expires',
  })
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
