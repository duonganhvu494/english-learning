export class SessionDeleteResponseDto {
  sessionId: string;

  static fromData(input: { sessionId: string }): SessionDeleteResponseDto {
    const dto = new SessionDeleteResponseDto();
    dto.sessionId = input.sessionId;
    return dto;
  }
}
