import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { WorkspaceEntitlementService } from 'src/workspaces/workspace-entitlement.service';
import { REQUIRED_ANY_ACCESS_KEY } from '../decorators/require-any-access.decorator';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { AccessRequirement } from '../interfaces/access-requirement.interface';
import { RequiredPermission } from '../interfaces/required-permission.interface';
import { RequiredRoles } from '../interfaces/required-roles.interface';
import { ScopeOptions } from '../interfaces/scope-options.interface';
import { WorkspaceAccessService } from '../workspace-access.service';

type RequestWithParamsAndBody = AuthRequest & {
  params: Record<string, string | undefined>;
  body: Record<string, unknown>;
};

@Injectable()
export class WorkspacePlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly workspaceEntitlementService: WorkspaceEntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scopeOptions = this.getScopeOptions(context);
    if (!scopeOptions) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<RequestWithParamsAndBody>();
    const workspaceId = await this.resolveWorkspaceId(scopeOptions, req);

    if (!workspaceId) {
      throw new BadRequestException(
        errorPayload(
          'Workspace scope id is required for workspace plan check',
          'WORKSPACE_PLAN_SCOPE_ID_REQUIRED',
        ),
      );
    }

    await this.workspaceEntitlementService.assertWorkspaceHasUsablePlan(
      workspaceId,
    );
    return true;
  }

  private getScopeOptions(context: ExecutionContext): ScopeOptions | null {
    const requiredAnyAccess =
      this.reflector.getAllAndOverride<AccessRequirement[]>(
        REQUIRED_ANY_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );
    const requiredPermission =
      this.reflector.getAllAndOverride<RequiredPermission>(
        REQUIRED_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );
    const requiredRoles = this.reflector.getAllAndOverride<RequiredRoles>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const candidates: ScopeOptions[] = [];
    if (requiredRoles) {
      candidates.push(requiredRoles);
    }
    if (requiredPermission) {
      candidates.push(requiredPermission);
    }
    if (requiredAnyAccess?.length) {
      candidates.push(...requiredAnyAccess);
    }

    return (
      candidates.find((candidate) => candidate.scopeType === 'workspace') ??
      candidates.find(
        (candidate) =>
          candidate.scopeType === 'class' &&
          (candidate.scopeIdParam ||
            candidate.scopeIdBodyField ||
            (candidate.scopeResourceType && candidate.scopeResourceIdParam)),
      ) ??
      null
    );
  }

  private async resolveWorkspaceId(
    required: ScopeOptions,
    req: RequestWithParamsAndBody,
  ): Promise<string | null> {
    if (required.scopeIdParam) {
      const scopeId = req.params?.[required.scopeIdParam] ?? null;
      if (!scopeId) {
        return null;
      }

      if (required.scopeType === 'workspace') {
        return scopeId;
      }

      if (required.scopeType === 'class') {
        return this.workspaceAccessService.resolveScopeIdByResource(
          'workspace',
          'class',
          scopeId,
        );
      }
    }

    if (required.scopeIdBodyField) {
      const scopeId = req.body?.[required.scopeIdBodyField];
      if (typeof scopeId !== 'string') {
        return null;
      }

      if (required.scopeType === 'workspace') {
        return scopeId;
      }

      if (required.scopeType === 'class') {
        return this.workspaceAccessService.resolveScopeIdByResource(
          'workspace',
          'class',
          scopeId,
        );
      }
    }

    if (required.scopeResourceType && required.scopeResourceIdParam) {
      const resourceId = req.params?.[required.scopeResourceIdParam];
      if (!resourceId) {
        return null;
      }

      return this.workspaceAccessService.resolveScopeIdByResource(
        'workspace',
        required.scopeResourceType,
        resourceId,
      );
    }

    return null;
  }
}
