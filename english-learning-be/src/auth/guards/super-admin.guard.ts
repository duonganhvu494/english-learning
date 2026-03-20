import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthRequest } from '../interfaces/auth-request.interface';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (request.user?.isSuperAdmin) {
      return true;
    }

    throw new ForbiddenException(
      errorPayload('Super admin access required', 'AUTH_SUPER_ADMIN_REQUIRED'),
    );
  }
}
