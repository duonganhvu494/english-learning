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
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RequiredPermission } from '../interfaces/required-permission.interface';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { RequiredRoles } from '../interfaces/required-roles.interface';

type RequestWithParamsAndBody = AuthRequest & {
  params: Record<string, string | undefined>;
  body: Record<string, unknown>;
};

@Injectable()
export class RbacPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<RequiredPermission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles = this.reflector.getAllAndOverride<RequiredRoles>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission && !requiredRoles) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<RequestWithParamsAndBody>();
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (requiredRoles) {
      const workspaceId = this.resolveWorkspaceId(requiredRoles, req);
      if (!workspaceId) {
        throw new BadRequestException('workspaceId is required for role check');
      }

      const hasRole = await this.rbacService.hasAnyRole({
        userId,
        workspaceId,
        roleNames: requiredRoles.roleNames,
      });
      if (!hasRole) {
        throw new ForbiddenException(
          `Role denied: requires one of [${requiredRoles.roleNames.join(', ')}]`,
        );
      }
    }

    if (requiredPermission) {
      const workspaceId = this.resolveWorkspaceId(requiredPermission, req);
      if (!workspaceId) {
        throw new BadRequestException(
          'workspaceId is required for permission check',
        );
      }

      const hasPermission = await this.rbacService.hasPermission({
        userId,
        workspaceId,
        action: requiredPermission.action,
        resource: requiredPermission.resource,
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission denied: ${requiredPermission.action}:${requiredPermission.resource}`,
        );
      }
    }

    return true;
  }

  private resolveWorkspaceId(
    required: Pick<
      RequiredPermission | RequiredRoles,
      'workspaceIdParam' | 'workspaceIdBodyField'
    >,
    req: RequestWithParamsAndBody,
  ): string | null {
    if (required.workspaceIdParam) {
      return req.params?.[required.workspaceIdParam] ?? null;
    }

    if (required.workspaceIdBodyField) {
      const value = req.body?.[required.workspaceIdBodyField];
      return typeof value === 'string' ? value : null;
    }

    return null;
  }
}
