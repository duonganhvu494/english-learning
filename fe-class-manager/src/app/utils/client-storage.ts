import type { UserProfile } from '@/types';

const STORAGE_KEYS = {
  csrfToken: 'ec_csrf_token',
  csrfHeaderName: 'ec_csrf_header_name',
  workspaceId: 'ec_workspace_id',
  currentUser: 'ec_current_user',
};

export function getStorageValue(key: keyof typeof STORAGE_KEYS): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEYS[key]);
}

export function setStorageValue(
  key: keyof typeof STORAGE_KEYS,
  value: string,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS[key], value);
}

export function removeStorageValue(key: keyof typeof STORAGE_KEYS): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS[key]);
}

export function getWorkspaceId(): string | null {
  return getStorageValue('workspaceId');
}

export function setWorkspaceId(workspaceId: string): void {
  setStorageValue('workspaceId', workspaceId);
}

export function clearWorkspaceId(): void {
  removeStorageValue('workspaceId');
}

export function getCurrentUser(): UserProfile | null {
  const raw = getStorageValue('currentUser');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile): void {
  setStorageValue('currentUser', JSON.stringify(user));
}

export function clearCurrentUser(): void {
  removeStorageValue('currentUser');
}

export function getCsrfToken(): string | null {
  return getStorageValue('csrfToken');
}

export function setCsrfToken(token: string): void {
  setStorageValue('csrfToken', token);
}

export function clearCsrfToken(): void {
  removeStorageValue('csrfToken');
}

export function getCsrfHeaderName(): string {
  return getStorageValue('csrfHeaderName') ?? 'x-csrf-token';
}

export function setCsrfHeaderName(headerName: string): void {
  setStorageValue('csrfHeaderName', headerName);
}

export function clearAuthStorage(): void {
  clearCsrfToken();
  clearCurrentUser();
  clearWorkspaceId();
}
