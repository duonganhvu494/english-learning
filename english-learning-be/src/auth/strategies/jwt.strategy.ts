import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../interfaces/request-cookie.interface';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req: RequestWithCookies) => {
        return req.cookies['accessToken'] ? req.cookies['accessToken'] : null;
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret', 'localhost'),
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.userId, email: payload.email};
  }
}
