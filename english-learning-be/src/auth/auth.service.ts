import {
    BadRequestException,
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
import { errorPayload } from 'src/common/utils/error-payload.util';

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
                errorPayload(
                    'Too many login attempts. Please try again later.',
                    'AUTH_LOGIN_RATE_LIMITED',
                ),
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const user = await this.usersService.findByUserName(userName);
        if (!user) {
            await this.authSessionsService.recordFailedLoginAttempt(
                userName,
                normalizedIpAddress,
            );
            throw new UnauthorizedException(
                errorPayload(
                    'Username is not registered',
                    'AUTH_USERNAME_NOT_REGISTERED',
                ),
            );
        }

        if (!user.isActive) {
            await this.authSessionsService.recordFailedLoginAttempt(
                userName,
                normalizedIpAddress,
            );
            throw new UnauthorizedException(
                errorPayload('Account is disabled', 'AUTH_ACCOUNT_DISABLED'),
            );
        }

        const matchPass = await bcrypt.compare(password, user.password);
        if (!matchPass) {
            await this.authSessionsService.recordFailedLoginAttempt(
                userName,
                normalizedIpAddress,
            );
            throw new UnauthorizedException(
                errorPayload('Password is incorrect', 'AUTH_PASSWORD_INCORRECT'),
            );
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
            throw new UnauthorizedException(
                errorPayload(
                    'Invalid refresh session',
                    'AUTH_REFRESH_SESSION_INVALID',
                ),
            );
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
            throw new UnauthorizedException(
                errorPayload('Invalid email', 'AUTH_INVALID_EMAIL'),
            );
        }
        return UserProfileResponse.fromEntity(user);
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ) {
        const user = await this.usersService.findByIdWithPassword(userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedException(
                errorPayload('Unauthorized', 'AUTH_UNAUTHORIZED'),
            );
        }

        if (currentPassword === newPassword) {
            throw new BadRequestException(
                errorPayload(
                    'New password must be different from current password',
                    'AUTH_NEW_PASSWORD_MUST_DIFFERENT',
                ),
            );
        }

        const matchPass = await bcrypt.compare(currentPassword, user.password);
        if (!matchPass) {
            throw new UnauthorizedException(
                errorPayload(
                    'Current password is incorrect',
                    'AUTH_CURRENT_PASSWORD_INCORRECT',
                ),
            );
        }

        const updatedUser = await this.usersService.updatePassword(
            userId,
            newPassword,
            false,
        );

        return {
            user: updatedUser,
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
            secret: this.config.getOrThrow<string>('jwt.secret'),
            expiresIn: this.config.get<string>('jwt.expiresIn', '15m') as StringValue,
        });
    }

    private signRefreshToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
            expiresIn: this.config.get<string>('jwt.refreshExpiresIn', '7d') as StringValue,
        });
    }

    private async revokeRefreshSessionFromToken(refreshToken?: string): Promise<void> {
        if (!refreshToken) {
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
                secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
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
                secret: this.config.getOrThrow<string>('jwt.secret'),
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
