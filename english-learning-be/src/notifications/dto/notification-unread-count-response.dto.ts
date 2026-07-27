
export class NotificationUnreadCountResponseDto {
  unreadCount: number;

  static fromData(input: {
    unreadCount: number;
  }): NotificationUnreadCountResponseDto {
    const dto = new NotificationUnreadCountResponseDto();
    dto.unreadCount = input.unreadCount;
    return dto;
  }
}
