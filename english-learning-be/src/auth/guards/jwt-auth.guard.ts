import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { errorPayload } from 'src/common/utils/error-payload.util';
import type { AuthRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private static readonly allowWhilePasswordChangeRequired = new Set([
    '/auth/me',
    '/auth/change-password',
  ]);

  handleRequest<TUser = AuthRequest['user']>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    const authenticatedUser: TUser = super.handleRequest(
      err,
      user,
      info,
      context,
      status,
    );
    const authUser = authenticatedUser as AuthRequest['user'];

    const request = context.switchToHttp().getRequest<{
      baseUrl?: string;
      route?: { path?: string };
      path?: string;
      originalUrl?: string;
    }>();

    const routePath = this.resolveRoutePath(request);
    if (
      authUser.mustChangePassword &&
      !JwtAuthGuard.allowWhilePasswordChangeRequired.has(routePath)
    ) {
      throw new ForbiddenException(
        errorPayload(
          'Password change is required before continuing',
          'AUTH_PASSWORD_CHANGE_REQUIRED',
        ),
      );
    }

    return authenticatedUser;
  }

  private resolveRoutePath(request: {
    baseUrl?: string;
    route?: { path?: string };
    path?: string;
    originalUrl?: string;
  }): string {
    if (request.baseUrl && request.route?.path) {
      return `${request.baseUrl}${request.route.path}`;
    }

    if (request.path) {
      return request.path;
    }

    return request.originalUrl?.split('?')[0] ?? '';
  }
}
