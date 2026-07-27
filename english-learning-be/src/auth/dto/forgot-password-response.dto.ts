
export class ForgotPasswordResponseDto {
  sent: boolean;

  static fromData(data: { sent: boolean }): ForgotPasswordResponseDto {
    const dto = new ForgotPasswordResponseDto();
    dto.sent = data.sent;
    return dto;
  }
}
