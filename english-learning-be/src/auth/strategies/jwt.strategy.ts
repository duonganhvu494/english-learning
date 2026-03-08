import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../interfaces/request-cookie.interface';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly authSessionsService: AuthSessionsService,
  ) {
    super({
      jwtFromRequest: (req: RequestWithCookies) => {
        return req.cookies['accessToken'] ? req.cookies['accessToken'] : null;
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret', 'localhost'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (payload.jti) {
      const isDenied = await this.authSessionsService.isAccessTokenDenied(
        payload.jti,
      );
      if (isDenied) {
        throw new UnauthorizedException('Access token has been revoked');
      }
    }

    return {
      userId: user.id,
      email: user.email,
      jti: payload.jti,
      isSuperAdmin: user.isSuperAdmin,
    };
  }
}
