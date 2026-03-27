import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ANY_ACCESS_KEY } from '../decorators/require-any-access.decorator';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { WorkspacePlanGuard } from './workspace-plan.guard';

describe('WorkspacePlanGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const workspaceAccessService = {
    resolveScopeIdByResource: jest.fn(),
  };
  const workspaceEntitlementService = {
    assertWorkspaceHasUsablePlan: jest.fn(),
  };

  let guard: WorkspacePlanGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new WorkspacePlanGuard(
      reflector as unknown as Reflector,
      workspaceAccessService as never,
      workspaceEntitlementService as never,
    );
  });

  it('passes through when no RBAC scope metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(
        createExecutionContext({
          params: {},
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(
      workspaceEntitlementService.assertWorkspaceHasUsablePlan,
    ).not.toHaveBeenCalled();
  });

  it('checks the workspace plan by direct workspace param', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_ROLES_KEY) {
        return {
          scopeType: 'workspace',
          scopeIdParam: 'workspaceId',
          roleNames: ['owner'],
        };
      }

      if (key === REQUIRED_PERMISSION_KEY || key === REQUIRED_ANY_ACCESS_KEY) {
        return undefined;
      }

      return undefined;
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          params: { workspaceId: 'workspace-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(
      workspaceEntitlementService.assertWorkspaceHasUsablePlan,
    ).toHaveBeenCalledWith('workspace-1');
  });

  it('resolves the workspace from a class-scoped route', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSION_KEY) {
        return {
          scopeType: 'class',
          scopeIdParam: 'classId',
          action: 'read',
          resource: 'session',
        };
      }

      if (key === REQUIRED_ROLES_KEY || key === REQUIRED_ANY_ACCESS_KEY) {
        return undefined;
      }

      return undefined;
    });
    workspaceAccessService.resolveScopeIdByResource.mockResolvedValue(
      'workspace-1',
    );

    await expect(
      guard.canActivate(
        createExecutionContext({
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
    expect(
      workspaceEntitlementService.assertWorkspaceHasUsablePlan,
    ).toHaveBeenCalledWith('workspace-1');
  });

  it('resolves the workspace from resource-based any-access metadata', async () => {
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
        ];
      }

      if (key === REQUIRED_ROLES_KEY || key === REQUIRED_PERMISSION_KEY) {
        return undefined;
      }

      return undefined;
    });
    workspaceAccessService.resolveScopeIdByResource.mockResolvedValue(
      'workspace-1',
    );

    await expect(
      guard.canActivate(
        createExecutionContext({
          params: { sessionId: 'session-1' },
          body: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(workspaceAccessService.resolveScopeIdByResource).toHaveBeenCalledWith(
      'workspace',
      'session',
      'session-1',
    );
    expect(
      workspaceEntitlementService.assertWorkspaceHasUsablePlan,
    ).toHaveBeenCalledWith('workspace-1');
  });

  it('throws when scope metadata exists but no id can be resolved', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_ROLES_KEY) {
        return {
          scopeType: 'workspace',
          scopeIdParam: 'workspaceId',
          roleNames: ['owner'],
        };
      }

      if (key === REQUIRED_PERMISSION_KEY || key === REQUIRED_ANY_ACCESS_KEY) {
        return undefined;
      }

      return undefined;
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          params: {},
          body: {},
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

function createExecutionContext(request: {
  user?: { userId?: string };
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}): ExecutionContext {
  return {
    getHandler: () => createExecutionContext,
    getClass: () => WorkspacePlanGuard,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
