import type {
  AbortMaterialUploadDto,
  CompleteMaterialUploadDto,
  InitMaterialUploadDto,
  MaterialDeleteResponse,
  MaterialResponse,
  MaterialUploadAbortResponse,
  MaterialUploadInitResponse,
  MaterialUploadPartSignedResponse,
  SignMaterialUploadPartDto,
} from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const materialsApi = {
  async initUpload(
    workspaceId: string,
    payload: InitMaterialUploadDto,
  ): Promise<MaterialUploadInitResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<MaterialUploadInitResponse>(
      http.post(`/workspaces/${workspaceId}/materials/upload-init`, payload),
    );
  },

  async signUploadPart(
    workspaceId: string,
    payload: SignMaterialUploadPartDto,
  ): Promise<MaterialUploadPartSignedResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<MaterialUploadPartSignedResponse>(
      http.post(`/workspaces/${workspaceId}/materials/upload-sign-part`, payload),
    );
  },

  async completeUpload(
    workspaceId: string,
    payload: CompleteMaterialUploadDto,
  ): Promise<MaterialResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<MaterialResponse>(
      http.post(`/workspaces/${workspaceId}/materials/upload-complete`, payload),
    );
  },

  async abortUpload(
    workspaceId: string,
    payload: AbortMaterialUploadDto,
  ): Promise<MaterialUploadAbortResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<MaterialUploadAbortResponse>(
      http.post(`/workspaces/${workspaceId}/materials/upload-abort`, payload),
    );
  },

  async listWorkspaceMaterials(workspaceId: string): Promise<MaterialResponse[]> {
    return unwrap<MaterialResponse[]>(
      http.get(`/workspaces/${workspaceId}/materials`),
    );
  },

  async getMaterial(materialId: string): Promise<MaterialResponse> {
    return unwrap<MaterialResponse>(http.get(`/materials/${materialId}`));
  },

  async deleteMaterial(materialId: string): Promise<MaterialDeleteResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<MaterialDeleteResponse>(http.delete(`/materials/${materialId}`));
  },
};
