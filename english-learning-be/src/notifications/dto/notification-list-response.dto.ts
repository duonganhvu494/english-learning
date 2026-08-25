import { NotificationResponseDto } from "./notification-response.dto";

export class NotificationListResponseDto {
  items: NotificationResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;

  static fromData(data: {
    items: NotificationResponseDto[];
    nextCursor: string | null;
    hasMore: boolean;
  }): NotificationListResponseDto {
    const dto = new NotificationListResponseDto();

    dto.items = data.items;
    dto.nextCursor = data.nextCursor;
    dto.hasMore = data.hasMore;

    return dto;
  }
}
