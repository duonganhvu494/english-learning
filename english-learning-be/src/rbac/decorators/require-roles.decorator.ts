import { SetMetadata } from '@nestjs/common';
import { RequiredRoles } from '../interfaces/required-roles.interface';
import { ScopeOptions } from '../interfaces/scope-options.interface';

export const REQUIRED_ROLES_KEY = 'required_roles';

export const RequireRoles = (
  roleNames: string[],
  options: ScopeOptions,
) =>
  SetMetadata(REQUIRED_ROLES_KEY, {
    roleNames,
    scopeType: options.scopeType,
    scopeIdParam: options.scopeIdParam,
    scopeIdBodyField: options.scopeIdBodyField,
    scopeResourceType: options.scopeResourceType,
    scopeResourceIdParam: options.scopeResourceIdParam,
  } satisfies RequiredRoles);
