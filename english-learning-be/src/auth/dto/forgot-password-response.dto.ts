import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: true })
  sent: boolean;

  static fromData(data: { sent: boolean }): ForgotPasswordResponseDto {
    const dto = new ForgotPasswordResponseDto();
    dto.sent = data.sent;
    return dto;
  }
}
