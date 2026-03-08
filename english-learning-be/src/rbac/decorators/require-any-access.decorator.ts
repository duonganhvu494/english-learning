import { SetMetadata } from '@nestjs/common';
import {
  AccessRequirement,
  PermissionAccessRequirement,
  RoleAccessRequirement,
} from '../interfaces/access-requirement.interface';
import { ScopeOptions } from '../interfaces/scope-options.interface';

export const REQUIRED_ANY_ACCESS_KEY = 'required_any_access';

export const requireRoleAccess = (
  roleNames: string[],
  options: ScopeOptions,
): RoleAccessRequirement => ({
  type: 'role',
  roleNames,
  scopeType: options.scopeType,
  scopeIdParam: options.scopeIdParam,
  scopeIdBodyField: options.scopeIdBodyField,
  scopeResourceType: options.scopeResourceType,
  scopeResourceIdParam: options.scopeResourceIdParam,
});

export const requirePermissionAccess = (
  action: string,
  resource: string,
  options: ScopeOptions,
): PermissionAccessRequirement => ({
  type: 'permission',
  action,
  resource,
  scopeType: options.scopeType,
  scopeIdParam: options.scopeIdParam,
  scopeIdBodyField: options.scopeIdBodyField,
  scopeResourceType: options.scopeResourceType,
  scopeResourceIdParam: options.scopeResourceIdParam,
});

export const RequireAnyAccess = (requirements: AccessRequirement[]) =>
  SetMetadata(REQUIRED_ANY_ACCESS_KEY, requirements);
