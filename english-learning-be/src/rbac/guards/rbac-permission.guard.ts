import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import {
  REQUIRED_ANY_ACCESS_KEY,
} from '../decorators/require-any-access.decorator';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RequiredPermission } from '../interfaces/required-permission.interface';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { RequiredRoles } from '../interfaces/required-roles.interface';
import { ScopeOptions } from '../interfaces/scope-options.interface';
import { WorkspaceAccessService } from '../workspace-access.service';
import { AccessRequirement } from '../interfaces/access-requirement.interface';

type RequestWithParamsAndBody = AuthRequest & {
  params: Record<string, string | undefined>;
  body: Record<string, unknown>;
};

@Injectable()
export class RbacPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    if (!requiredAnyAccess?.length && !requiredPermission && !requiredRoles) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<RequestWithParamsAndBody>();
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (requiredAnyAccess?.length) {
      const hasAnyAccess = await this.hasAnyAccessRequirement(
        requiredAnyAccess,
        req,
        userId,
      );
      if (!hasAnyAccess) {
        throw new ForbiddenException(
          'Access denied: requires one of the configured RBAC rules',
        );
      }
    }

    if (requiredRoles) {
      const hasRole = await this.hasRoleRequirement(requiredRoles, req, userId);
      if (!hasRole) {
        throw new ForbiddenException(
          `Role denied: requires one of [${requiredRoles.roleNames.join(', ')}]`,
        );
      }
    }

    if (requiredPermission) {
      const hasPermission = await this.hasPermissionRequirement(
        requiredPermission,
        req,
        userId,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission denied: ${requiredPermission.action}:${requiredPermission.resource}`,
        );
      }
    }

    return true;
  }

  private async hasAnyAccessRequirement(
    requirements: AccessRequirement[],
    req: RequestWithParamsAndBody,
    userId: string,
  ): Promise<boolean> {
    for (const requirement of requirements) {
      if (requirement.type === 'role') {
        const hasRole = await this.hasRoleRequirement(requirement, req, userId);
        if (hasRole) {
          return true;
        }
        continue;
      }

      const hasPermission = await this.hasPermissionRequirement(
        requirement,
        req,
        userId,
      );
      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  private async hasRoleRequirement(
    requiredRoles: RequiredRoles,
    req: RequestWithParamsAndBody,
    userId: string,
  ): Promise<boolean> {
    const scopeId = await this.resolveScopeId(requiredRoles, req);
    if (!scopeId) {
      throw new BadRequestException(
        `${requiredRoles.scopeType} scope id is required for role check`,
      );
    }

    return this.rbacService.hasAnyRole({
      userId,
      scopeType: requiredRoles.scopeType,
      scopeId,
      roleNames: requiredRoles.roleNames,
    });
  }

  private async hasPermissionRequirement(
    requiredPermission: RequiredPermission,
    req: RequestWithParamsAndBody,
    userId: string,
  ): Promise<boolean> {
    const scopeId = await this.resolveScopeId(requiredPermission, req);
    if (!scopeId) {
      throw new BadRequestException(
        `${requiredPermission.scopeType} scope id is required for permission check`,
      );
    }

    return this.rbacService.hasPermission({
      userId,
      scopeType: requiredPermission.scopeType,
      scopeId,
      action: requiredPermission.action,
      resource: requiredPermission.resource,
    });
  }

  private async resolveScopeId(
    required: ScopeOptions,
    req: RequestWithParamsAndBody,
  ): Promise<string | null> {
    if (required.scopeIdParam) {
      return req.params?.[required.scopeIdParam] ?? null;
    }

    if (required.scopeIdBodyField) {
      const value = req.body?.[required.scopeIdBodyField];
      return typeof value === 'string' ? value : null;
    }

    if (required.scopeResourceType && required.scopeResourceIdParam) {
      const resourceId = req.params?.[required.scopeResourceIdParam];
      if (!resourceId) {
        return null;
      }

      const scopeId: string =
        await this.workspaceAccessService.resolveScopeIdByResource(
        required.scopeType,
        required.scopeResourceType,
        resourceId,
        );

      return scopeId;
    }

    return null;
  }
}
