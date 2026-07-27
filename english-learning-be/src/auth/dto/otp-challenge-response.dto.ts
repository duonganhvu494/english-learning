
export class OtpChallengeResponseDto {
  email: string;

  expiresAt: string;

  static fromData(data: { email: string; expiresAt: Date }): OtpChallengeResponseDto {
    const dto = new OtpChallengeResponseDto();
    dto.email = data.email;
    dto.expiresAt = data.expiresAt.toISOString();
    return dto;
  }
}
