import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AuthSessionsService } from 'src/auth/redis/auth-sessions.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly authSessionsService: AuthSessionsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const payload = await this.authenticateClient(client);
      client.data.userId = payload.userId;
      await client.join(this.getUserRoom(payload.userId));
      this.scheduleDisconnectAtTokenExpiry(client, payload.exp);
      client.emit('notifications.connected', {
        userId: payload.userId,
      });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const expiryTimer = client.data.accessTokenExpiryTimer as
      | ReturnType<typeof setTimeout>
      | undefined;
    if (expiryTimer) {
      clearTimeout(expiryTimer);
    }
  }

  emitNotificationCreated(
    userId: string,
    notification: NotificationResponseDto,
    unreadCount: number,
  ): void {
    this.server.to(this.getUserRoom(userId)).emit('notification.created', {
      notification,
      unreadCount,
    });
    this.server
      .to(this.getUserRoom(userId))
      .emit('notifications.unread_count_updated', {
        unreadCount,
      });
  }

  emitNotificationRead(
    userId: string,
    notificationId: string,
    unreadCount: number,
    readAt: Date | null,
  ): void {
    this.server.to(this.getUserRoom(userId)).emit('notification.read', {
      notificationId,
      readAt,
      unreadCount,
    });
    this.server
      .to(this.getUserRoom(userId))
      .emit('notifications.unread_count_updated', {
        unreadCount,
      });
  }

  emitNotificationsReadAll(
    userId: string,
    updatedCount: number,
    unreadCount: number,
  ): void {
    this.server.to(this.getUserRoom(userId)).emit('notifications.read_all', {
      updatedCount,
      unreadCount,
    });
    this.server
      .to(this.getUserRoom(userId))
      .emit('notifications.unread_count_updated', {
        unreadCount,
      });
  }

  private async authenticateClient(client: Socket): Promise<JwtPayload> {
    const accessToken = this.extractAccessToken(client);
    if (!accessToken) {
      throw new Error('Missing access token');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
    });
    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new Error('Account is disabled');
    }

    if (payload.jti) {
      const isDenied = await this.authSessionsService.isAccessTokenDenied(
        payload.jti,
      );
      if (isDenied) {
        throw new Error('Access token revoked');
      }
    }

    return payload;
  }

  private extractAccessToken(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = this.parseCookies(cookieHeader);
    const accessToken = cookies.accessToken;
    return typeof accessToken === 'string' && accessToken.length > 0
      ? accessToken
      : null;
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    for (const cookiePart of cookieHeader.split(';')) {
      const trimmedPart = cookiePart.trim();
      if (!trimmedPart) {
        continue;
      }

      const separatorIndex = trimmedPart.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmedPart.slice(0, separatorIndex).trim();
      const value = trimmedPart.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }

  private scheduleDisconnectAtTokenExpiry(
    client: Socket,
    exp?: number,
  ): void {
    if (!exp) {
      return;
    }

    const expiresInMs = exp * 1000 - Date.now();
    if (expiresInMs <= 0) {
      client.disconnect(true);
      return;
    }

    client.data.accessTokenExpiryTimer = setTimeout(() => {
      client.disconnect(true);
    }, expiresInMs);
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }
}
