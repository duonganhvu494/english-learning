import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { AuthSecurityService } from '../auth-security.service';
import type { RequestWithCookies } from '../interfaces/request-cookie.interface';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly authSecurityService: AuthSecurityService) {}

  use(req: RequestWithCookies, _res: Response, next: NextFunction): void {
    if (this.authSecurityService.isSafeMethod(req.method)) {
      next();
      return;
    }

    if (this.isCsrfExemptRoute(req.path)) {
      next();
      return;
    }

    if (!this.authSecurityService.hasAuthCookies(req)) {
      next();
      return;
    }

    if (!this.authSecurityService.hasValidCsrfToken(req)) {
      throw new ForbiddenException(
        errorPayload(
          'CSRF token is missing or invalid',
          'AUTH_CSRF_INVALID',
        ),
      );
    }

    next();
  }

  private isCsrfExemptRoute(path: string): boolean {
    return path === '/auth/login' || path === '/users/register';
  }
}
