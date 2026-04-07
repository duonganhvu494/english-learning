import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuthSessionsService } from 'src/auth/redis/auth-sessions.service';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import { UsersService } from 'src/users/users.service';
import { AuthOtpService } from 'src/auth/redis/auth-otp.service';
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto';
import { OtpChallengeResponseDto } from './dto/otp-challenge-response.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { VerifyEmailResponseDto } from './dto/verify-email-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authOtpService: AuthOtpService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authSessionsService: AuthSessionsService,
  ) {}

  async signIn(
    identifier: string,
    password: string,
    ipAddress = 'unknown',
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserProfileResponse;
  }> {
    const normalizedIdentifier = this.normalizeLoginIdentifier(identifier);
    const normalizedIpAddress = this.normalizeIpAddress(ipAddress);
    const isRateLimited = await this.authSessionsService.isLoginRateLimited(
      normalizedIdentifier,
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

    const user = await this.usersService.findByEmailOrUserName(
      normalizedIdentifier,
    );
    if (!user) {
      await this.authSessionsService.recordFailedLoginAttempt(
        normalizedIdentifier,
        normalizedIpAddress,
      );
      throw new UnauthorizedException(
        errorPayload(
          'Username or email is not registered',
          'AUTH_USERNAME_NOT_REGISTERED',
        ),
      );
    }

    if (!user.isActive) {
      await this.authSessionsService.recordFailedLoginAttempt(
        normalizedIdentifier,
        normalizedIpAddress,
      );
      throw new UnauthorizedException(
        errorPayload('Account is disabled', 'AUTH_ACCOUNT_DISABLED'),
      );
    }

    if (user.emailVerificationRequired && !user.emailVerifiedAt) {
      await this.authSessionsService.recordFailedLoginAttempt(
        normalizedIdentifier,
        normalizedIpAddress,
      );
      throw new UnauthorizedException(
        errorPayload(
          'Email verification is required before login',
          'AUTH_EMAIL_NOT_VERIFIED',
        ),
      );
    }

    const matchPass = await bcrypt.compare(password, user.password);
    if (!matchPass) {
      await this.authSessionsService.recordFailedLoginAttempt(
        normalizedIdentifier,
        normalizedIpAddress,
      );
      throw new UnauthorizedException(
        errorPayload('Password is incorrect', 'AUTH_PASSWORD_INCORRECT'),
      );
    }

    await this.authSessionsService.clearLoginAttempts(
      normalizedIdentifier,
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

  async refreshSession(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!payload.jti) {
      throw new UnauthorizedException(
        errorPayload('Invalid refresh session', 'AUTH_REFRESH_SESSION_INVALID'),
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentRefreshToken?: string,
  ): Promise<{ user: UserProfileResponse }> {
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

    const currentRefreshJti = await this.extractRefreshJti(currentRefreshToken);
    if (currentRefreshJti) {
      await this.authSessionsService.revokeAllUserSessionsExcept(
        userId,
        currentRefreshJti,
      );
    } else {
      await this.authSessionsService.revokeAllUserSessions(userId);
    }

    return {
      user: updatedUser,
    };
  }

  async verifyEmailOtp(
    email: string,
    otp: string,
  ): Promise<VerifyEmailResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.isActive) {
      throw new BadRequestException(
        errorPayload(
          'Verification request is invalid',
          'AUTH_EMAIL_VERIFICATION_INVALID',
        ),
      );
    }

    if (!user.emailVerificationRequired) {
      return VerifyEmailResponseDto.fromData({
        emailVerified: true,
        user: UserProfileResponse.fromEntity(user),
      });
    }

    const verificationStatus =
      await this.authOtpService.verifyEmailVerificationOtp(user.id, otp);
    if (verificationStatus === 'expired') {
      throw new BadRequestException(
        errorPayload(
          'Verification OTP has expired',
          'AUTH_EMAIL_VERIFICATION_OTP_EXPIRED',
        ),
      );
    }
    if (verificationStatus !== 'valid') {
      throw new BadRequestException(
        errorPayload(
          'Verification OTP is invalid',
          'AUTH_EMAIL_VERIFICATION_OTP_INVALID',
        ),
      );
    }

    const verifiedUser = await this.usersService.markEmailVerified(user.id);
    return VerifyEmailResponseDto.fromData({
      emailVerified: true,
      user: verifiedUser,
    });
  }

  async resendEmailVerificationOtp(
    email: string,
  ): Promise<OtpChallengeResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new BadRequestException(
        errorPayload('Email is not registered', 'AUTH_EMAIL_NOT_REGISTERED'),
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        errorPayload('Account is disabled', 'AUTH_ACCOUNT_DISABLED'),
      );
    }

    if (!user.emailVerificationRequired) {
      throw new BadRequestException(
        errorPayload('Email is already verified', 'AUTH_EMAIL_ALREADY_VERIFIED'),
      );
    }

    const expiresAt = await this.usersService.issueEmailVerificationChallenge(
      normalizedEmail,
    );
    if (!expiresAt) {
      throw new BadRequestException(
        errorPayload(
          'Unable to issue verification OTP',
          'AUTH_EMAIL_VERIFICATION_UNAVAILABLE',
        ),
      );
    }

    return OtpChallengeResponseDto.fromData({
      email: normalizedEmail,
      expiresAt,
    });
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    await this.usersService.issuePasswordResetChallenge(normalizedEmail);

    return ForgotPasswordResponseDto.fromData({ sent: true });
  }

  async resetPasswordWithOtp(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<ResetPasswordResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmailWithPassword(
      normalizedEmail,
    );

    if (!user || !user.isActive) {
      throw new BadRequestException(
        errorPayload(
          'Password reset OTP is invalid',
          'AUTH_PASSWORD_RESET_OTP_INVALID',
        ),
      );
    }

    const verificationStatus = await this.authOtpService.verifyPasswordResetOtp(
      user.id,
      otp,
    );
    if (verificationStatus === 'expired') {
      throw new BadRequestException(
        errorPayload(
          'Password reset OTP has expired',
          'AUTH_PASSWORD_RESET_OTP_EXPIRED',
        ),
      );
    }
    if (verificationStatus !== 'valid') {
      throw new BadRequestException(
        errorPayload(
          'Password reset OTP is invalid',
          'AUTH_PASSWORD_RESET_OTP_INVALID',
        ),
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        errorPayload(
          'New password must be different from current password',
          'AUTH_NEW_PASSWORD_MUST_DIFFERENT',
        ),
      );
    }

    const updatedUser = await this.usersService.resetPasswordByOtp(
      user.id,
      newPassword,
    );
    await this.authSessionsService.revokeAllUserSessions(user.id);

    return ResetPasswordResponseDto.fromData({
      user: updatedUser,
    });
  }

  private async issueTokens(
    identity: Omit<JwtPayload, 'jti'>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
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

  private signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn', '15m') as StringValue,
    });
  }

  private signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>(
        'jwt.refreshExpiresIn',
        '7d',
      ) as StringValue,
    });
  }

  private async revokeRefreshSessionFromToken(
    refreshToken?: string,
  ): Promise<void> {
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

  private async extractRefreshJti(refreshToken?: string): Promise<string | null> {
    if (!refreshToken) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
      return payload.jti ?? null;
    } catch {
      return null;
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

  private normalizeLoginIdentifier(identifier: string): string {
    const normalizedIdentifier = identifier.trim();
    return normalizedIdentifier.includes('@')
      ? normalizedIdentifier.toLowerCase()
      : normalizedIdentifier;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
