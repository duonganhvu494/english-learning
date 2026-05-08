import { workspacesApi } from '@/api';
import { getWorkspaceId, setWorkspaceId } from './client-storage';

export async function resolveWorkspaceId(force = false): Promise<string> {
  const cachedWorkspaceId = getWorkspaceId();
  if (!force && cachedWorkspaceId) {
    return cachedWorkspaceId;
  }

  const workspace = await workspacesApi.getMyWorkspace();
  setWorkspaceId(workspace.id);
  return workspace.id;
}
