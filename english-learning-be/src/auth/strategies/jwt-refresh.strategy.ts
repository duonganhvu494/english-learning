// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { RequestWithCookies } from '../interfaces/request-cookie.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly authSessionsService: AuthSessionsService,
  ) {
    super({
      jwtFromRequest: (req: RequestWithCookies) => {
        return req.cookies['refreshToken'] ? req.cookies['refreshToken'] : null;
      },
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.refreshSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.jti) {
      throw new UnauthorizedException(
        errorPayload('Invalid refresh session', 'AUTH_REFRESH_SESSION_INVALID'),
      );
    }

    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        errorPayload('Account is disabled', 'AUTH_ACCOUNT_DISABLED'),
      );
    }

    const hasSession = await this.authSessionsService.hasRefreshSession(
      user.id,
      payload.jti,
    );
    if (!hasSession) {
      throw new UnauthorizedException(
        errorPayload(
          'Refresh session is invalid',
          'AUTH_REFRESH_SESSION_REVOKED',
        ),
      );
    }

    return {
      userId: user.id,
      email: user.email,
      jti: payload.jti,
      isSuperAdmin: user.isSuperAdmin,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
