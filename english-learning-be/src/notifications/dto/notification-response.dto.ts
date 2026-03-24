import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationEntity,
  NotificationType,
} from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440990' })
  id: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.ASSIGNMENT_CREATED,
  })
  type: string;

  @ApiProperty({ example: 'New assignment posted' })
  title: string;

  @ApiProperty({ example: 'Homework 01 has been posted for Session 1.' })
  body: string;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: true,
    example: {
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      sessionId: '550e8400-e29b-41d4-a716-446655440300',
      assignmentId: '550e8400-e29b-41d4-a716-446655440400',
    },
  })
  data: Record<string, unknown> | null;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({
    example: '2026-03-24T10:15:00.000Z',
    nullable: true,
  })
  readAt: Date | null;

  @ApiProperty({ example: '2026-03-24T10:00:00.000Z' })
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
