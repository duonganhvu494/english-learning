import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { ListMyNotificationsQueryDto } from './dto/list-my-notifications-query.dto';
import { NotificationMarkAllReadResponseDto } from './dto/notification-mark-all-read-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationUnreadCountResponseDto } from './dto/notification-unread-count-response.dto';
import {
  NotificationEntity,
  NotificationType,
} from './entities/notification.entity';
import { NotificationsGateway } from './realtime/notifications.gateway';

type NotificationWriteInput = {
  recipientUserId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  dedupeKey?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async listMyNotifications(
    userId: string,
    query: ListMyNotificationsQueryDto,
  ): Promise<NotificationResponseDto[]> {
    const limit = query.limit ?? 20;
    const where = query.unreadOnly
      ? {
          recipient: { id: userId },
          isRead: false,
        }
      : {
          recipient: { id: userId },
        };

    const notifications = await this.notificationRepo.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return notifications.map((notification) =>
      NotificationResponseDto.fromEntity(notification),
    );
  }

  async getMyUnreadCount(
    userId: string,
  ): Promise<NotificationUnreadCountResponseDto> {
    const unreadCount = await this.notificationRepo.count({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
    });

    return NotificationUnreadCountResponseDto.fromData({
      unreadCount,
    });
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepo.findOne({
      where: {
        id: notificationId,
        recipient: { id: userId },
      },
    });

    if (!notification) {
      throw new BadRequestException(
        errorPayload('Notification not found', 'NOTIFICATION_NOT_FOUND'),
      );
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
      const unreadCount = await this.countUnreadNotifications(userId);
      this.notificationsGateway.emitNotificationRead(
        userId,
        notification.id,
        unreadCount,
        notification.readAt,
      );
    }

    return NotificationResponseDto.fromEntity(notification);
  }

  async markAllAsRead(
    userId: string,
  ): Promise<NotificationMarkAllReadResponseDto> {
    const unreadNotifications = await this.notificationRepo.find({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
      select: {
        id: true,
      },
    });

    if (unreadNotifications.length === 0) {
      return NotificationMarkAllReadResponseDto.fromData({
        updatedCount: 0,
      });
    }

    const notificationIds = unreadNotifications.map((notification) => notification.id);
    await this.notificationRepo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('id IN (:...notificationIds)', { notificationIds })
      .execute();

    this.notificationsGateway.emitNotificationsReadAll(
      userId,
      notificationIds.length,
      0,
    );

    return NotificationMarkAllReadResponseDto.fromData({
      updatedCount: notificationIds.length,
    });
  }

  async createNotification(input: NotificationWriteInput): Promise<void> {
    const recipient = await this.userRepo.findOne({
      where: { id: input.recipientUserId },
      select: {
        id: true,
      },
    });

    if (!recipient) {
      throw new BadRequestException(
        errorPayload(
          'Notification recipient not found',
          'NOTIFICATION_RECIPIENT_NOT_FOUND',
        ),
      );
    }

    const notification = this.notificationRepo.create({
      recipient,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      isRead: false,
      readAt: null,
      dedupeKey: input.dedupeKey ?? null,
    });

    try {
      await this.notificationRepo.save(notification);
    } catch (error) {
      if (
        input.dedupeKey &&
        this.isPostgresUniqueViolation(error)
      ) {
        return;
      }

      throw error;
    }

    const unreadCount = await this.countUnreadNotifications(input.recipientUserId);
    this.notificationsGateway.emitNotificationCreated(
      input.recipientUserId,
      NotificationResponseDto.fromEntity(notification),
      unreadCount,
    );
  }

  async createManyNotifications(inputs: NotificationWriteInput[]): Promise<void> {
    for (const input of inputs) {
      await this.createNotification(input);
    }
  }

  private isPostgresUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private countUnreadNotifications(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
    });
  }
}
