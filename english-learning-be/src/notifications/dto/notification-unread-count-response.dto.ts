import { ApiProperty } from '@nestjs/swagger';

export class NotificationUnreadCountResponseDto {
  @ApiProperty({ example: 3 })
  unreadCount: number;

  static fromData(input: {
    unreadCount: number;
  }): NotificationUnreadCountResponseDto {
    const dto = new NotificationUnreadCountResponseDto();
    dto.unreadCount = input.unreadCount;
    return dto;
  }
}
