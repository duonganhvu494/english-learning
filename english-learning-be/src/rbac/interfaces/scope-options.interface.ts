export type RbacScopeType = 'workspace' | 'class';

export type ScopeResourceType = 'class' | 'session';

export interface ScopeOptions {
  scopeType: RbacScopeType;
  scopeIdParam?: string;
  scopeIdBodyField?: string;
  scopeResourceType?: ScopeResourceType;
  scopeResourceIdParam?: string;
}
