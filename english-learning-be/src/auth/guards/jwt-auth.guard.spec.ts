import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('allows authenticated users without password-change requirement', () => {
    const user = guard.handleRequest(
      null,
      {
        userId: 'user-1',
        email: 'student@example.com',
        mustChangePassword: false,
      },
      null,
      createExecutionContext('/workspaces/me'),
    );

    expect(user).toEqual({
      userId: 'user-1',
      email: 'student@example.com',
      mustChangePassword: false,
    });
  });

  it('allows auth me route while password change is required', () => {
    const user = guard.handleRequest(
      null,
      {
        userId: 'user-1',
        email: 'student@example.com',
        mustChangePassword: true,
      },
      null,
      createExecutionContext('/auth/me', '/auth', '/me'),
    );

    expect(user).toEqual({
      userId: 'user-1',
      email: 'student@example.com',
      mustChangePassword: true,
    });
  });

  it('blocks protected routes while password change is required', () => {
    expect(() =>
      guard.handleRequest(
        null,
        {
          userId: 'user-1',
          email: 'student@example.com',
          mustChangePassword: true,
        },
        null,
        createExecutionContext('/workspaces/me'),
      ),
    ).toThrow(ForbiddenException);
  });
});

function createExecutionContext(
  path: string,
  baseUrl = '',
  routePath?: string,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        path,
        baseUrl,
        route: routePath ? { path: routePath } : undefined,
      }),
    }),
  } as ExecutionContext;
}
