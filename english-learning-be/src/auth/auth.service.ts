import {
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { randomUUID } from 'crypto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly authSessionsService: AuthSessionsService,
    ) {}

    async signIn(userName: string, password: string, ipAddress = 'unknown') {
        const normalizedIpAddress = this.normalizeIpAddress(ipAddress);
        const isRateLimited = await this.authSessionsService.isLoginRateLimited(
            userName,
            normalizedIpAddress,
        );
        if (isRateLimited) {
            throw new HttpException(
                'Too many login attempts. Please try again later.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const user = await this.usersService.findByUserName(userName);
        if (!user) {
            await this.authSessionsService.recordFailedLoginAttempt(
                userName,
                normalizedIpAddress,
            );
            throw new UnauthorizedException('Username is not registered');
        }

        if (!user.isActive) {
            await this.authSessionsService.recordFailedLoginAttempt(
                userName,
                normalizedIpAddress,
            );
            throw new UnauthorizedException('Account is disabled');
        }

        const matchPass = await bcrypt.compare(password, user.password);
        if (!matchPass) {
            await this.authSessionsService.recordFailedLoginAttempt(
                userName,
                normalizedIpAddress,
            );
            throw new UnauthorizedException('Password is incorrect');
        }

        await this.authSessionsService.clearLoginAttempts(
            userName,
            normalizedIpAddress,
        );

        const { accessToken, refreshToken } = await this.issueTokens({
            userId: user.id,
            email: user.email,
        });

        return {
            accessToken,
            refreshToken,
            user: UserProfileResponse.fromEntity(user),
        };
    }

    async refreshSession(payload: JwtPayload) {
        if (!payload.jti) {
            throw new UnauthorizedException('Invalid refresh session');
        }

        const nextJti = randomUUID();
        const tokenIdentity = {
            userId: payload.userId,
            email: payload.email,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(tokenIdentity),
            this.signRefreshToken({
                ...tokenIdentity,
                jti: nextJti,
            }),
        ]);

        await this.authSessionsService.replaceRefreshSession(
            payload.userId,
            payload.jti,
            nextJti,
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    async logout(accessToken?: string, refreshToken?: string): Promise<void> {
        await Promise.all([
            this.revokeRefreshSessionFromToken(refreshToken),
            this.denyAccessTokenFromToken(accessToken),
        ]);
    }

    async me(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid email');
        }
        return {
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
        };
    }

    private async issueTokens(identity: Omit<JwtPayload, 'jti'>) {
        const accessJti = randomUUID();
        const refreshJti = randomUUID();

        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken({
                ...identity,
                jti: accessJti,
            }),
            this.signRefreshToken({
                ...identity,
                jti: refreshJti,
            }),
        ]);

        await this.authSessionsService.storeRefreshSession(
            identity.userId,
            refreshJti,
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    private signAccessToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('jwt.secret', 'localhost'),
            expiresIn: this.config.get<string>('jwt.expiresIn', '15m') as StringValue,
        });
    }

    private signRefreshToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('jwt.refreshSecret', 'localhost'),
            expiresIn: this.config.get<string>('jwt.refreshExpiresIn', '7d') as StringValue,
        });
    }

    private async revokeRefreshSessionFromToken(refreshToken?: string): Promise<void> {
        if (!refreshToken) {
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
                secret: this.config.get<string>('jwt.refreshSecret', 'localhost'),
            });

            if (payload.jti) {
                await this.authSessionsService.revokeRefreshSession(
                    payload.userId,
                    payload.jti,
                );
            }
        } catch {
            return;
        }
    }

    private async denyAccessTokenFromToken(accessToken?: string): Promise<void> {
        if (!accessToken) {
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
                secret: this.config.get<string>('jwt.secret', 'localhost'),
            });

            if (!payload.jti || !payload.exp) {
                return;
            }

            const ttlSeconds = Math.max(
                1,
                payload.exp - Math.floor(Date.now() / 1000),
            );

            await this.authSessionsService.denyAccessToken(payload.jti, ttlSeconds);
        } catch {
            return;
        }
    }

    private normalizeIpAddress(ipAddress: string): string {
        const normalized = ipAddress.trim();
        return normalized.length > 0 ? normalized : 'unknown';
    }
}
