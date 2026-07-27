import {
  NotificationEntity,
  NotificationType,
} from '../entities/notification.entity';

export class NotificationResponseDto {
  id: string;

  type: string;

  title: string;

  body: string;

  data: Record<string, unknown> | null;

  isRead: boolean;

  readAt: Date | null;

  createdAt: Date;

  static fromEntity(entity: NotificationEntity): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.title = entity.title;
    dto.body = entity.body;
    dto.data = entity.data;
    dto.isRead = entity.isRead;
    dto.readAt = entity.readAt;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
