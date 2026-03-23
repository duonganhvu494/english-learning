import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSecurityService } from './auth-security.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signIn: jest.Mock;
    refreshSession: jest.Mock;
    logout: jest.Mock;
    changePassword: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
    getOrThrow: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
      refreshSession: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string, fallback?: unknown) => {
        switch (key) {
          case 'jwt.expiresIn':
            return '15m';
          case 'jwt.refreshExpiresIn':
            return '7d';
          default:
            return fallback;
        }
      }),
      getOrThrow: jest.fn((key: string) => {
        switch (key) {
          case 'cookie.secure':
            return false;
          case 'cookie.sameSite':
            return 'lax';
          case 'security.csrfCookieName':
            return 'csrfToken';
          case 'security.csrfHeaderName':
            return 'x-csrf-token';
          default:
            throw new Error(`Unexpected config key: ${key}`);
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        AuthSecurityService,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('signs in and sets auth cookies', async () => {
    const res = { cookie: jest.fn() };
    authService.signIn.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1' },
    });

    const result = await controller.login(
      { userName: 'teacher1', password: 'secret123' },
      { ip: '127.0.0.1' } as never,
      res as never,
    );

    expect(authService.signIn).toHaveBeenCalledWith(
      'teacher1',
      'secret123',
      '127.0.0.1',
    );
    expect(res.cookie).toHaveBeenNthCalledWith(
      1,
      'accessToken',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 15 * 60 * 1000,
      }),
    );
    expect(res.cookie).toHaveBeenNthCalledWith(
      2,
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
    expect(res.cookie).toHaveBeenNthCalledWith(
      3,
      'csrfToken',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Login successful',
      result: { id: 'user-1' },
    });
  });

  it('refreshes the session and rotates cookies', async () => {
    const res = { cookie: jest.fn() };
    authService.refreshSession.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });

    const result = await controller.refresh_token(
      {
        user: {
          userId: 'user-1',
          email: 'teacher@example.com',
          jti: 'refresh-jti',
        },
      } as never,
      res as never,
    );

    expect(authService.refreshSession).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'teacher@example.com',
      jti: 'refresh-jti',
    });
    expect(res.cookie).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      statusCode: 200,
      message: 'Session refreshed',
      result: null,
    });
  });

  it('logs out and clears auth cookies', async () => {
    const res = {
      clearCookie: jest.fn(),
    };
    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(
      {
        cookies: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      } as never,
      res as never,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      'access-token',
      'refresh-token',
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      1,
      'accessToken',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      },
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      2,
      'refreshToken',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      },
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      3,
      'csrfToken',
      {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
      },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Logged out',
      result: null,
    });
  });

  it('issues a csrf token cookie and response payload', () => {
    const res = { cookie: jest.fn() };

    const result = controller.getCsrfToken(res as never);

    expect(res.cookie).toHaveBeenCalledWith(
      'csrfToken',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(result.message).toBe('CSRF token issued');
    expect(result.result).toEqual({
      csrfToken: expect.any(String),
      headerName: 'x-csrf-token',
    });
  });

  it('returns the authenticated user profile', async () => {
    const result = await controller.getMe({
      user: {
        userId: 'user-1',
        userName: 'teacher1',
        fullName: 'Teacher One',
        email: 'teacher@example.com',
        mustChangePassword: false,
      },
    } as never);

    expect(result).toEqual({
      statusCode: 200,
      message: 'Is authenticated',
      result: {
        id: 'user-1',
        userName: 'teacher1',
        fullName: 'Teacher One',
        email: 'teacher@example.com',
        mustChangePassword: false,
      },
    });
  });

  it('changes password for the authenticated user', async () => {
    authService.changePassword.mockResolvedValue({
      user: {
        id: 'user-1',
        mustChangePassword: false,
      },
    });

    const result = await controller.changePassword(
      {
        user: {
          userId: 'user-1',
        },
      } as never,
      {
        currentPassword: 'temp-secret',
        newPassword: 'new-secret',
      },
    );

    expect(authService.changePassword).toHaveBeenCalledWith(
      'user-1',
      'temp-secret',
      'new-secret',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Password changed successfully',
      result: {
        user: {
          id: 'user-1',
          mustChangePassword: false,
        },
      },
    });
  });
});
