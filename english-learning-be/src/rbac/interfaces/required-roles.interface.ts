import { ScopeOptions } from './scope-options.interface';

export interface RequiredRoles extends ScopeOptions {
  roleNames: string[];
}
