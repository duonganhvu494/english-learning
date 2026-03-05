import { SetMetadata } from '@nestjs/common';
import { RequiredPermission } from '../interfaces/required-permission.interface';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export const RequirePermission = (
  action: string,
  resource: string,
  options?: Pick<RequiredPermission, 'workspaceIdParam' | 'workspaceIdBodyField'>,
) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, {
    action,
    resource,
    workspaceIdParam: options?.workspaceIdParam,
    workspaceIdBodyField: options?.workspaceIdBodyField,
  } satisfies RequiredPermission);
