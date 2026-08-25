import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { AuthRequest } from "src/auth/interfaces/auth-request.interface";

import { ApiResponse } from "src/common/dto/api-response.dto";

import { ListMyNotificationsQueryDto } from "./dto/list-my-notifications-query.dto";
import { NotificationListResponseDto } from "./dto/notification-list-response.dto";
import { NotificationMarkAllReadResponseDto } from "./dto/notification-mark-all-read-response.dto";
import { NotificationResponseDto } from "./dto/notification-response.dto";
import { NotificationUnreadCountResponseDto } from "./dto/notification-unread-count-response.dto";

import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("me")
  async listMyNotifications(
    @Req() req: AuthRequest,
    @Query() query: ListMyNotificationsQueryDto,
  ): Promise<ApiResponse<NotificationListResponseDto>> {
    const result = await this.notificationsService.listMyNotifications(
      req.user.userId,
      query,
    );

    return ApiResponse.success(result, "Notifications fetched");
  }

  @Get("me/unread-count")
  async getMyUnreadCount(
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<NotificationUnreadCountResponseDto>> {
    const result = await this.notificationsService.getMyUnreadCount(
      req.user.userId,
    );

    return ApiResponse.success(result, "Unread notification count fetched");
  }

  @Patch(":notificationId/read")
  async markAsRead(
    @Param("notificationId")
    notificationId: string,

    @Req()
    req: AuthRequest,
  ): Promise<ApiResponse<NotificationResponseDto>> {
    const result = await this.notificationsService.markAsRead(
      notificationId,
      req.user.userId,
    );

    return ApiResponse.success(result, "Notification marked as read");
  }

  @Patch("me/read-all")
  async markAllAsRead(
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<NotificationMarkAllReadResponseDto>> {
    const result = await this.notificationsService.markAllAsRead(
      req.user.userId,
    );

    return ApiResponse.success(result, "All notifications marked as read");
  }
}
