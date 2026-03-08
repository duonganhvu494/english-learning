import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ANY_ACCESS_KEY } from '../decorators/require-any-access.decorator';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { RbacPermissionGuard } from './rbac-permission.guard';

describe('RbacPermissionGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const rbacService = {
    hasAnyRole: jest.fn(),
    hasPermission: jest.fn(),
  };
  const workspaceAccessService = {
    resolveScopeIdByResource: jest.fn(),
  };

  let guard: RbacPermissionGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RbacPermissionGuard(
      reflector as unknown as Reflector,
      rbacService as never,
      workspaceAccessService as never,
    );
  });

  it('should check workspace-scoped role by direct param', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSION_KEY) {
        return undefined;
      }

      if (key === REQUIRED_ANY_ACCESS_KEY) {
        return undefined;
      }

      if (key === REQUIRED_ROLES_KEY) {
        return {
          scopeType: 'workspace',
          scopeIdParam: 'workspaceId',
          roleNames: ['owner'],
        };
      }

      return undefined;
    });
    rbacService.hasAnyRole.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { userId: 'user-1' },
          params: { workspaceId: 'workspace-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(rbacService.hasAnyRole).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeType: 'workspace',
      scopeId: 'workspace-1',
      roleNames: ['owner'],
    });
  });

  it('should check class-scoped permission by direct param', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSION_KEY) {
        return {
          scopeType: 'class',
          scopeIdParam: 'classId',
          action: 'create',
          resource: 'assignment',
        };
      }

      if (key === REQUIRED_ANY_ACCESS_KEY) {
        return undefined;
      }

      if (key === REQUIRED_ROLES_KEY) {
        return undefined;
      }

      return undefined;
    });
    rbacService.hasPermission.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { userId: 'student-1' },
          params: { classId: 'class-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(rbacService.hasPermission).toHaveBeenCalledWith({
      userId: 'student-1',
      scopeType: 'class',
      scopeId: 'class-1',
      action: 'create',
      resource: 'assignment',
    });
  });

  it('should resolve workspace scope from class resource', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSION_KEY) {
        return undefined;
      }

      if (key === REQUIRED_ANY_ACCESS_KEY) {
        return undefined;
      }

      if (key === REQUIRED_ROLES_KEY) {
        return {
          scopeType: 'workspace',
          scopeResourceType: 'class',
          scopeResourceIdParam: 'classId',
          roleNames: ['owner'],
        };
      }

      return undefined;
    });
    workspaceAccessService.resolveScopeIdByResource.mockResolvedValue(
      'workspace-1',
    );
    rbacService.hasAnyRole.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { userId: 'user-1' },
          params: { classId: 'class-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(workspaceAccessService.resolveScopeIdByResource).toHaveBeenCalledWith(
      'workspace',
      'class',
      'class-1',
    );
    expect(rbacService.hasAnyRole).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeType: 'workspace',
      scopeId: 'workspace-1',
      roleNames: ['owner'],
    });
  });

  it('should pass any-access when workspace owner role matches', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_ANY_ACCESS_KEY) {
        return [
          {
            type: 'role',
            scopeType: 'workspace',
            scopeResourceType: 'session',
            scopeResourceIdParam: 'sessionId',
            roleNames: ['owner'],
          },
          {
            type: 'permission',
            scopeType: 'class',
            scopeResourceType: 'session',
            scopeResourceIdParam: 'sessionId',
            action: 'update',
            resource: 'attendance',
          },
        ];
      }

      return undefined;
    });
    workspaceAccessService.resolveScopeIdByResource.mockResolvedValue('scope-1');
    rbacService.hasAnyRole.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { userId: 'owner-1' },
          params: { sessionId: 'session-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(rbacService.hasAnyRole).toHaveBeenCalledWith({
      userId: 'owner-1',
      scopeType: 'workspace',
      scopeId: 'scope-1',
      roleNames: ['owner'],
    });
  });

  it('should pass any-access when class permission matches', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_ANY_ACCESS_KEY) {
        return [
          {
            type: 'role',
            scopeType: 'workspace',
            scopeResourceType: 'session',
            scopeResourceIdParam: 'sessionId',
            roleNames: ['owner'],
          },
          {
            type: 'permission',
            scopeType: 'class',
            scopeResourceType: 'session',
            scopeResourceIdParam: 'sessionId',
            action: 'update',
            resource: 'attendance',
          },
        ];
      }

      return undefined;
    });
    workspaceAccessService.resolveScopeIdByResource
      .mockResolvedValueOnce('workspace-1')
      .mockResolvedValueOnce('class-1');
    rbacService.hasAnyRole.mockResolvedValue(false);
    rbacService.hasPermission.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { userId: 'student-1' },
          params: { sessionId: 'session-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(rbacService.hasPermission).toHaveBeenCalledWith({
      userId: 'student-1',
      scopeType: 'class',
      scopeId: 'class-1',
      action: 'update',
      resource: 'attendance',
    });
  });
});

function createExecutionContext(request: {
  user?: { userId?: string };
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}): ExecutionContext {
  return {
    getHandler: () => createExecutionContext,
    getClass: () => RbacPermissionGuard,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
