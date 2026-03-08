import { ScopeOptions } from './scope-options.interface';

export interface RoleAccessRequirement extends ScopeOptions {
  type: 'role';
  roleNames: string[];
}

export interface PermissionAccessRequirement extends ScopeOptions {
  type: 'permission';
  action: string;
  resource: string;
}

export type AccessRequirement =
  | RoleAccessRequirement
  | PermissionAccessRequirement;
