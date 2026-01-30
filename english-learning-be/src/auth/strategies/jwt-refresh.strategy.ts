// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RequestWithCookies } from '../interfaces/request-cookie.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: (req: RequestWithCookies) => {
        return req.cookies['refreshToken'] ? req.cookies['refreshToken'] : null;
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret', 'localhost'),
    });
  }

  validate(payload: JwtPayload) {
    return { userID: payload.userId, email: payload.email};
  }
}
