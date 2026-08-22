export class StartBillingSubscriptionResponseDto {
  sessionId: string;
  checkoutUrl: string;

  static fromData(input: {
    sessionId: string;
    checkoutUrl: string;
  }): StartBillingSubscriptionResponseDto {
    const dto = new StartBillingSubscriptionResponseDto();

    dto.sessionId = input.sessionId;
    dto.checkoutUrl = input.checkoutUrl;

    return dto;
  }
}