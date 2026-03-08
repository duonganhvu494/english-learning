import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
  const usersService = {
    findByUserName: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };
  const authSessionsService = {
    storeRefreshSession: jest.fn(),
    replaceRefreshSession: jest.fn(),
    revokeRefreshSession: jest.fn(),
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
    usersService.findByUserName.mockResolvedValue({
      id: 'user-1',
      email: 'disabled@example.com',
      password: 'hashed-password',
      isActive: false,
    });

    await expect(service.signIn('disabled-user', 'secret')).rejects.toThrow(
      new UnauthorizedException('Account is disabled'),
    );
    expect(usersService.findByUserName).toHaveBeenCalledWith('disabled-user');
    expect(authSessionsService.recordFailedLoginAttempt).toHaveBeenCalled();
  });

  it('should sign in active users with valid password', async () => {
    authSessionsService.isLoginRateLimited.mockResolvedValue(false);
    compareMock.mockResolvedValue(true);
    usersService.findByUserName.mockResolvedValue({
      id: 'user-1',
      email: 'active@example.com',
      userName: 'active-user',
      fullName: 'Active User',
      password: 'hashed-password',
      isActive: true,
    });
    jwtService.signAsync.mockResolvedValueOnce('access-token');
    jwtService.signAsync.mockResolvedValueOnce('refresh-token');
    configService.get.mockImplementation((key: string, fallback?: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.expiresIn':
          return '15m';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return fallback;
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

  it('should rotate refresh session when refreshing tokens', async () => {
    jwtService.signAsync.mockResolvedValueOnce('next-access-token');
    jwtService.signAsync.mockResolvedValueOnce('next-refresh-token');
    configService.get.mockImplementation((key: string, fallback?: string) => {
      switch (key) {
        case 'jwt.secret':
          return 'secret';
        case 'jwt.expiresIn':
          return '15m';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return fallback;
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

  it('should ignore invalid refresh token during logout', async () => {
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
    expect(usersService.findByUserName).not.toHaveBeenCalled();
  });

  it('should denylist access token during logout when token is valid', async () => {
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
});
