import { SetMetadata } from '@nestjs/common';
import { RequiredPermission } from '../interfaces/required-permission.interface';
import { ScopeOptions } from '../interfaces/scope-options.interface';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export const RequirePermission = (
  action: string,
  resource: string,
  options: ScopeOptions,
) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, {
    action,
    resource,
    scopeType: options.scopeType,
    scopeIdParam: options.scopeIdParam,
    scopeIdBodyField: options.scopeIdBodyField,
    scopeResourceType: options.scopeResourceType,
    scopeResourceIdParam: options.scopeResourceIdParam,
  } satisfies RequiredPermission);
