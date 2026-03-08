import { ScopeOptions } from './scope-options.interface';

export interface RequiredPermission extends ScopeOptions {
  action: string;
  resource: string;
}
