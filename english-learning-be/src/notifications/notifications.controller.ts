import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import {
  ApiBusinessErrorResponses,
  ApiEnvelopeResponse,
} from 'src/common/swagger/swagger-response.decorator';
import { ListMyNotificationsQueryDto } from './dto/list-my-notifications-query.dto';
import { NotificationMarkAllReadResponseDto } from './dto/notification-mark-all-read-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationUnreadCountResponseDto } from './dto/notification-unread-count-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'List my notifications',
    description:
      'Returns the current authenticated user notifications ordered by newest first.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    model: NotificationResponseDto,
    isArray: true,
    exampleMessage: 'Notifications fetched',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440990',
        type: 'assignment_created',
        title: 'New assignment posted',
        body: 'Homework 01 has been posted for Session 1.',
        data: {
          assignmentId: '550e8400-e29b-41d4-a716-446655440400',
          sessionId: '550e8400-e29b-41d4-a716-446655440300',
        },
        isRead: false,
        readAt: null,
        createdAt: '2026-03-24T10:00:00.000Z',
      },
    ],
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async listMyNotifications(
    @Req() req: AuthRequest,
    @Query() query: ListMyNotificationsQueryDto,
  ): Promise<ApiResponse<NotificationResponseDto[]>> {
    const result = await this.notificationsService.listMyNotifications(
      req.user.userId,
      query,
    );
    return ApiResponse.success(result, 'Notifications fetched');
  }

  @Get('me/unread-count')
  @ApiOperation({
    summary: 'Get my unread notification count',
    description:
      'Returns the number of unread notifications for the current authenticated user.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Unread notification count retrieved successfully',
    model: NotificationUnreadCountResponseDto,
    exampleMessage: 'Unread notification count fetched',
    exampleResult: {
      unreadCount: 3,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
  ])
  async getMyUnreadCount(@Req() req: AuthRequest): Promise<ApiResponse<NotificationUnreadCountResponseDto>> {
    const result = await this.notificationsService.getMyUnreadCount(
      req.user.userId,
    );
    return ApiResponse.success(result, 'Unread notification count fetched');
  }

  @Patch(':notificationId/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description:
      'Marks a notification owned by the current authenticated user as read.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    model: NotificationResponseDto,
    exampleMessage: 'Notification marked as read',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440990',
      type: 'assignment_created',
      title: 'New assignment posted',
      body: 'Homework 01 has been posted for Session 1.',
      data: {
        assignmentId: '550e8400-e29b-41d4-a716-446655440400',
      },
      isRead: true,
      readAt: '2026-03-24T10:10:00.000Z',
      createdAt: '2026-03-24T10:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 403,
      code: 'AUTH_CSRF_INVALID',
      message: 'CSRF token is missing or invalid',
    },
    {
      status: 400,
      code: 'NOTIFICATION_NOT_FOUND',
      message: 'Notification not found',
    },
  ])
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<NotificationResponseDto>> {
    const result = await this.notificationsService.markAsRead(
      notificationId,
      req.user.userId,
    );
    return ApiResponse.success(result, 'Notification marked as read');
  }

  @Patch('me/read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Marks all notifications of the current authenticated user as read.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
    model: NotificationMarkAllReadResponseDto,
    exampleMessage: 'All notifications marked as read',
    exampleResult: {
      updatedCount: 5,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 403,
      code: 'AUTH_CSRF_INVALID',
      message: 'CSRF token is missing or invalid',
    },
  ])
  async markAllAsRead(@Req() req: AuthRequest): Promise<ApiResponse<NotificationMarkAllReadResponseDto>> {
    const result = await this.notificationsService.markAllAsRead(
      req.user.userId,
    );
    return ApiResponse.success(result, 'All notifications marked as read');
  }
}
