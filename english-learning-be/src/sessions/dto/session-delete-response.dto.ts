import { ApiProperty } from '@nestjs/swagger';

export class SessionDeleteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440400' })
  sessionId: string;

  static fromData(input: { sessionId: string }): SessionDeleteResponseDto {
    const dto = new SessionDeleteResponseDto();
    dto.sessionId = input.sessionId;
    return dto;
  }
}
