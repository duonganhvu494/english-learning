import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthSecurityService } from '../auth-security.service';
import { CsrfMiddleware } from './csrf.middleware';

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfMiddleware,
        AuthSecurityService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              return fallback;
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
          },
        },
      ],
    }).compile();

    middleware = module.get<CsrfMiddleware>(CsrfMiddleware);
  });

  it('allows safe methods without csrf validation', () => {
    const next = jest.fn();

    middleware.use(
      {
        method: 'GET',
        path: '/workspaces',
        cookies: {},
        headers: {},
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  it('allows login route without csrf validation', () => {
    const next = jest.fn();

    middleware.use(
      {
        method: 'POST',
        path: '/auth/login',
        cookies: {},
        headers: {},
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects mutating authenticated requests when csrf token is missing', () => {
    expect(() =>
      middleware.use(
        {
          method: 'POST',
          path: '/workspaces/1/classes',
          cookies: { accessToken: 'access-token' },
          headers: {},
        } as never,
        {} as never,
        jest.fn(),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows mutating authenticated requests when csrf token matches', () => {
    const next = jest.fn();

    middleware.use(
      {
        method: 'POST',
        path: '/workspaces/1/classes',
        cookies: {
          accessToken: 'access-token',
          csrfToken: 'csrf-token',
        },
        headers: {
          'x-csrf-token': 'csrf-token',
        },
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalled();
  });
});
