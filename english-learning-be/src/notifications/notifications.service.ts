import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { User } from "src/users/entities/user.entity";
import { errorPayload } from "src/common/utils/error-payload.util";

import { ListMyNotificationsQueryDto } from "./dto/list-my-notifications-query.dto";
import { NotificationMarkAllReadResponseDto } from "./dto/notification-mark-all-read-response.dto";
import { NotificationResponseDto } from "./dto/notification-response.dto";
import { NotificationUnreadCountResponseDto } from "./dto/notification-unread-count-response.dto";
import { NotificationListResponseDto } from "./dto/notification-list-response.dto";

import {
  NotificationEntity,
  NotificationType,
} from "./entities/notification.entity";

import { NotificationsGateway } from "./realtime/notifications.gateway";

type NotificationWriteInput = {
  recipientUserId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  dedupeKey?: string | null;
};

type NotificationCursor = {
  createdAt: string;
  id: string;
};

type InsertedNotificationRow = {
  id: string;
  recipientUserId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  dedupeKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UnreadCountRow = {
  recipientUserId: string;
  unreadCount: string;
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
  ): Promise<NotificationListResponseDto> {
    const limit = query.limit ?? 20;

    const queryBuilder = this.notificationRepo
      .createQueryBuilder("notification")
      .where('notification."recipientUserId" = :userId', {
        userId,
      })
      .orderBy('notification."createdAt"', "DESC")
      .addOrderBy("notification.id", "DESC")
      .take(limit + 1);

    if (query.unreadOnly) {
      queryBuilder.andWhere('notification."isRead" = false');
    }

    if (query.cursor) {
      const cursor = this.decodeCursor(query.cursor);

      queryBuilder.andWhere(
        `
        (
          notification."createdAt" < :cursorCreatedAt
          OR (
            notification."createdAt" = :cursorCreatedAt
            AND notification.id < :cursorId
          )
        )
      `,
        {
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        },
      );
    }

    const notifications = await queryBuilder.getMany();

    const hasMore = notifications.length > limit;

    const items = hasMore ? notifications.slice(0, limit) : notifications;

    const lastItem = items[items.length - 1];

    const nextCursor = hasMore && lastItem ? this.encodeCursor(lastItem) : null;

    return NotificationListResponseDto.fromData({
      items: items.map((notification) =>
        NotificationResponseDto.fromEntity(notification),
      ),
      nextCursor,
      hasMore,
    });
  }

  async getMyUnreadCount(
    userId: string,
  ): Promise<NotificationUnreadCountResponseDto> {
    const unreadCount = await this.countUnreadNotifications(userId);

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
        recipient: {
          id: userId,
        },
      },
    });

    if (!notification) {
      throw new BadRequestException(
        errorPayload("Notification not found", "NOTIFICATION_NOT_FOUND"),
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
        recipient: {
          id: userId,
        },
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

    const notificationIds = unreadNotifications.map(
      (notification) => notification.id,
    );

    await this.notificationRepo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where("id IN (:...notificationIds)", {
        notificationIds,
      })
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
      where: {
        id: input.recipientUserId,
      },
      select: {
        id: true,
      },
    });

    if (!recipient) {
      throw new BadRequestException(
        errorPayload(
          "Notification recipient not found",
          "NOTIFICATION_RECIPIENT_NOT_FOUND",
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
      if (input.dedupeKey && this.isPostgresUniqueViolation(error)) {
        return;
      }

      throw error;
    }

    const unreadCount = await this.countUnreadNotifications(
      input.recipientUserId,
    );

    this.notificationsGateway.emitNotificationCreated(
      input.recipientUserId,
      NotificationResponseDto.fromEntity(notification),
      unreadCount,
    );
  }

  async createManyNotifications(
    inputs: NotificationWriteInput[],
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const recipientUserIds = [
      ...new Set(inputs.map((input) => input.recipientUserId)),
    ];

    const recipients = await this.userRepo.find({
      where: {
        id: In(recipientUserIds),
      },
      select: {
        id: true,
      },
    });

    const existingRecipientIds = new Set(
      recipients.map((recipient) => recipient.id),
    );

    const missingRecipientIds = recipientUserIds.filter(
      (userId) => !existingRecipientIds.has(userId),
    );

    if (missingRecipientIds.length > 0) {
      throw new BadRequestException(
        errorPayload(
          `Notification recipient not found: ${missingRecipientIds.join(", ")}`,
          "NOTIFICATION_RECIPIENT_NOT_FOUND",
        ),
      );
    }

    const values = inputs.map((input) => ({
      recipient: {
        id: input.recipientUserId,
      },
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      isRead: false,
      readAt: null,
      dedupeKey: input.dedupeKey ?? null,
    }));

    const insertResult = await this.notificationRepo
      .createQueryBuilder()
      .insert()
      .into(NotificationEntity)
      .values(values as QueryDeepPartialEntity<NotificationEntity>[])
      .orIgnore()
      .returning("*")
      .execute();

    const insertedRows = insertResult.raw as InsertedNotificationRow[];

    if (insertedRows.length === 0) {
      return;
    }

    const insertedRecipientIds: string[] = [
      ...new Set(insertedRows.map((row) => row.recipientUserId)),
    ];

    const unreadCounts =
      await this.getUnreadCountsByUserIds(insertedRecipientIds);

    for (const row of insertedRows) {
      const unreadCount = unreadCounts.get(row.recipientUserId) ?? 0;

      const notification = this.notificationRepo.create({
        id: row.id,
        recipient: {
          id: row.recipientUserId,
        } as User,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data,
        isRead: row.isRead,
        readAt: row.readAt,
        dedupeKey: row.dedupeKey,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });

      this.notificationsGateway.emitNotificationCreated(
        row.recipientUserId,
        NotificationResponseDto.fromEntity(notification),
        unreadCount,
      );
    }
  }

  private async getUnreadCountsByUserIds(
    userIds: string[],
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const rows = (await this.notificationRepo
      .createQueryBuilder("notification")
      .select('notification."recipientUserId"', "recipientUserId")
      .addSelect("COUNT(notification.id)", "unreadCount")
      .where('notification."recipientUserId" IN (:...userIds)', {
        userIds,
      })
      .andWhere('notification."isRead" = false')
      .groupBy('notification."recipientUserId"')
      .getRawMany()) as UnreadCountRow[];

    return new Map(
      rows.map((row) => [row.recipientUserId, Number(row.unreadCount)]),
    );
  }

  private isPostgresUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }

  private countUnreadNotifications(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: {
        recipient: {
          id: userId,
        },
        isRead: false,
      },
    });
  }

  private encodeCursor(notification: NotificationEntity): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: notification.createdAt.toISOString(),
        id: notification.id,
      }),
    ).toString("base64url");
  }

  private decodeCursor(cursor: string): NotificationCursor {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, "base64url").toString("utf8"),
      ) as NotificationCursor;

      if (!parsed.createdAt || !parsed.id) {
        throw new Error();
      }

      const createdAt = new Date(parsed.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new Error();
      }

      return {
        createdAt: createdAt.toISOString(),
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException(
        errorPayload(
          "Invalid notification cursor",
          "NOTIFICATION_CURSOR_INVALID",
        ),
      );
    }
  }
}
