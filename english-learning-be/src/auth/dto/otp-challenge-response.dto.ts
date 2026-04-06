import { ApiProperty } from '@nestjs/swagger';

export class OtpChallengeResponseDto {
  @ApiProperty({ example: 'teacher@example.com' })
  email: string;

  @ApiProperty({
    example: '2026-04-06T10:15:00.000Z',
    description: 'UTC timestamp when the OTP expires',
  })
  expiresAt: string;

  static fromData(data: { email: string; expiresAt: Date }): OtpChallengeResponseDto {
    const dto = new OtpChallengeResponseDto();
    dto.email = data.email;
    dto.expiresAt = data.expiresAt.toISOString();
    return dto;
  }
}
