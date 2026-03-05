import { SetMetadata } from '@nestjs/common';
import { RequiredRoles } from '../interfaces/required-roles.interface';

export const REQUIRED_ROLES_KEY = 'required_roles';

export const RequireRoles = (
  roleNames: string[],
  options?: Pick<RequiredRoles, 'workspaceIdParam' | 'workspaceIdBodyField'>,
) =>
  SetMetadata(REQUIRED_ROLES_KEY, {
    roleNames,
    workspaceIdParam: options?.workspaceIdParam,
    workspaceIdBodyField: options?.workspaceIdBodyField,
  } satisfies RequiredRoles);
