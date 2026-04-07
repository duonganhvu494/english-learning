import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthOtpService } from 'src/auth/redis/auth-otp.service';
import { UsersService } from 'src/users/users.service';
import { AuthSessionsService } from 'src/auth/redis/auth-sessions.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
  const usersService = {
    findByEmailOrUserName: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByIdWithPassword: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    issueEmailVerificationChallenge: jest.fn(),
    issuePasswordResetChallenge: jest.fn(),
    resetPasswordByOtp: jest.fn(),
  };
  const authOtpService = {
    verifyEmailVerificationOtp: jest.fn(),
    verifyPasswordResetOtp: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  const authSessionsService = {
    storeRefreshSession: jest.fn(),
    replaceRefreshSession: jest.fn(),
    revokeRefreshSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    revokeAllUserSessionsExcept: jest.fn(),
    isLoginRateLimited: jest.fn(),
    recordFailedLoginAttempt: jest.fn(),
    clearLoginAttempts: jest.fn(),
    denyAccessToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: AuthOtpService,
          useValue: authOtpService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: AuthSessionsService,
          useValue: authSessionsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject disabled users on sign in', async () => {
    authSessionsService.isLoginRateLimited.mockResolvedValue(false);
    usersService.findByEmailOrUserName.mockResolvedValue({
      id: 'user-1',
      email: 'disabled@example.com',
      password: 'hashed-password',
      isActive: false,
    });

    await expect(service.signIn('disabled-user', 'secret')).rejects.toThrow(
      new UnauthorizedException('Account is disabled'),
    );
    expect(usersService.findByEmailOrUserName).toHaveBeenCalledWith(
      'disabled-user',
    );
    expect(authSessionsService.recordFailedLoginAttempt).toHaveBeenCalled();
  });

  it('should sign in active users with valid password', async () => {
    authSessionsService.isLoginRateLimited.mockResolvedValue(false);
    compareMock.mockResolvedValue(true);
    usersService.findByEmailOrUserName.mockResolvedValue({
      id: 'user-1',
      email: 'active@example.com',
      userName: 'active-user',
      fullName: 'Active User',
      password: 'hashed-password',
      isActive: true,
      emailVerificationRequired: false,
      emailVerifiedAt: new Date(),
    });
    jwtService.signAsync.mockResolvedValueOnce('access-token');
    jwtService.signAsync.mockResolvedValueOnce('refresh-token');
    configService.get.mockImplementation((key: string, fallback?: string) => {
      switch (key) {
        case 'jwt.expiresIn':
          return '15m';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return fallback;
      }
    });
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });

    const result = await service.signIn('active-user', 'secret');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('active@example.com');
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(authSessionsService.storeRefreshSession).toHaveBeenCalledTimes(1);
    expect(authSessionsService.clearLoginAttempts).toHaveBeenCalledWith(
      'active-user',
      'unknown',
    );
  });

  it('should sign in by email when the identifier is an email address', async () => {
    authSessionsService.isLoginRateLimited.mockResolvedValue(false);
    compareMock.mockResolvedValue(true);
    usersService.findByEmailOrUserName.mockResolvedValue({
      id: 'user-1',
      email: 'active@example.com',
      userName: 'active-user',
      fullName: 'Active User',
      password: 'hashed-password',
      isActive: true,
      emailVerificationRequired: false,
      emailVerifiedAt: new Date(),
    });
    jwtService.signAsync.mockResolvedValueOnce('access-token');
    jwtService.signAsync.mockResolvedValueOnce('refresh-token');
    configService.get.mockImplementation((key: string, fallback?: string) => {
      switch (key) {
        case 'jwt.expiresIn':
          return '15m';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return fallback;
      }
    });
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });

    const result = await service.signIn('active@example.com', 'secret');

    expect(result.user.email).toBe('active@example.com');
    expect(usersService.findByEmailOrUserName).toHaveBeenCalledWith(
      'active@example.com',
    );
    expect(authSessionsService.clearLoginAttempts).toHaveBeenCalledWith(
      'active@example.com',
      'unknown',
    );
  });

  it('should rotate refresh session when refreshing tokens', async () => {
    jwtService.signAsync.mockResolvedValueOnce('next-access-token');
    jwtService.signAsync.mockResolvedValueOnce('next-refresh-token');
    configService.get.mockImplementation((key: string, fallback?: string) => {
      switch (key) {
        case 'jwt.expiresIn':
          return '15m';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return fallback;
      }
    });
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });


    const result = await service.refreshSession({
      userId: 'user-1',
      email: 'active@example.com',
      jti: 'old-jti',
    });

    expect(result).toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
    expect(authSessionsService.replaceRefreshSession).toHaveBeenCalledWith(
      'user-1',
      'old-jti',
      expect.any(String),
    );
  });

  it('should reject sign in when email verification is still pending', async () => {
    authSessionsService.isLoginRateLimited.mockResolvedValue(false);
    usersService.findByEmailOrUserName.mockResolvedValue({
      id: 'user-1',
      email: 'pending@example.com',
      userName: 'pending-user',
      fullName: 'Pending User',
      password: 'hashed-password',
      isActive: true,
      emailVerificationRequired: true,
      emailVerifiedAt: null,
    });

    await expect(service.signIn('pending-user', 'secret')).rejects.toThrow(
      new UnauthorizedException('Email verification is required before login'),
    );
    expect(authSessionsService.recordFailedLoginAttempt).toHaveBeenCalled();
  });

  it('should ignore invalid refresh token during logout', async () => {
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(service.logout('bad-access-token', 'bad-refresh-token')).resolves.toBeUndefined();
    expect(authSessionsService.revokeRefreshSession).not.toHaveBeenCalled();
    expect(authSessionsService.denyAccessToken).not.toHaveBeenCalled();
  });

  it('should block login when rate limit is exceeded', async () => {
    authSessionsService.isLoginRateLimited.mockResolvedValue(true);

    await expect(
      service.signIn('active-user', 'secret', '127.0.0.1'),
    ).rejects.toThrow(
      new HttpException(
        'Too many login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
    expect(usersService.findByEmailOrUserName).not.toHaveBeenCalled();
  });

  it('should denylist access token during logout when token is valid', async () => {
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });
    jwtService.verifyAsync
      .mockResolvedValueOnce({
        userId: 'user-1',
        email: 'active@example.com',
        jti: 'refresh-jti',
      })
      .mockResolvedValueOnce({
        userId: 'user-1',
        email: 'active@example.com',
        jti: 'access-jti',
        exp: Math.floor(Date.now() / 1000) + 300,
      });

    await service.logout('access-token', 'refresh-token');

    expect(authSessionsService.revokeRefreshSession).toHaveBeenCalledWith(
      'user-1',
      'refresh-jti',
    );
    expect(authSessionsService.denyAccessToken).toHaveBeenCalledWith(
      'access-jti',
      expect.any(Number),
    );
  });

  it('should change password and clear mustChangePassword', async () => {
    usersService.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      password: 'hashed-password',
      isActive: true,
    });
    compareMock.mockResolvedValue(true);
    usersService.updatePassword.mockResolvedValue({
      id: 'user-1',
      mustChangePassword: false,
    });
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });
    jwtService.verifyAsync.mockResolvedValue({
      userId: 'user-1',
      email: 'active@example.com',
      jti: 'current-refresh-jti',
    });

    const result = await service.changePassword(
      'user-1',
      'old-secret',
      'new-secret',
      'refresh-token',
    );

    expect(usersService.findByIdWithPassword).toHaveBeenCalledWith('user-1');
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      'new-secret',
      false,
    );
    expect(authSessionsService.revokeAllUserSessionsExcept).toHaveBeenCalledWith(
      'user-1',
      'current-refresh-jti',
    );
    expect(authSessionsService.revokeAllUserSessions).not.toHaveBeenCalled();
    expect(result).toEqual({
      user: {
        id: 'user-1',
        mustChangePassword: false,
      },
    });
  });

  it('should revoke all sessions when current refresh token is missing or invalid during password change', async () => {
    usersService.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      password: 'hashed-password',
      isActive: true,
    });
    compareMock.mockResolvedValue(true);
    usersService.updatePassword.mockResolvedValue({
      id: 'user-1',
      mustChangePassword: false,
    });
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await service.changePassword(
      'user-1',
      'old-secret',
      'new-secret',
      'invalid-refresh-token',
    );

    expect(authSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
      'user-1',
    );
    expect(
      authSessionsService.revokeAllUserSessionsExcept,
    ).not.toHaveBeenCalled();
  });

  it('should reject change password when current password is incorrect', async () => {
    usersService.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      password: 'hashed-password',
      isActive: true,
    });
    compareMock.mockResolvedValue(false);

    await expect(
      service.changePassword('user-1', 'wrong-secret', 'new-secret'),
    ).rejects.toThrow(UnauthorizedException);
    expect(usersService.updatePassword).not.toHaveBeenCalled();
  });
});
