export class RegisterUserResponseDto {
  registrationId: string;

  email: string;

  emailVerificationRequired: boolean;

  emailVerificationExpiresAt: string;

  static fromData(data: {
    registrationId: string;
    email: string;
    emailVerificationRequired: boolean;
    emailVerificationExpiresAt: Date;
  }): RegisterUserResponseDto {
    const dto = new RegisterUserResponseDto();

    dto.registrationId = data.registrationId;
    dto.email = data.email;
    dto.emailVerificationRequired = data.emailVerificationRequired;
    dto.emailVerificationExpiresAt =
      data.emailVerificationExpiresAt.toISOString();

    return dto;
  }
}
