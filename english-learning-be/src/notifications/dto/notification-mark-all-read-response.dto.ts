
export class NotificationMarkAllReadResponseDto {
  updatedCount: number;

  static fromData(input: {
    updatedCount: number;
  }): NotificationMarkAllReadResponseDto {
    const dto = new NotificationMarkAllReadResponseDto();
    dto.updatedCount = input.updatedCount;
    return dto;
  }
}
