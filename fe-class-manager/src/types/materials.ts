export type MaterialCategory =
  | "general"
  | "lecture"
  | "assignment"
  | "submission";

export interface InitMaterialUploadDto {
  title?: string;
  fileName: string;
  mimeType: string;
  size: number;
  category?: MaterialCategory;
}

export interface MaterialUploadInitResponse {
  materialId: string;
  uploadSessionId: string;
  uploadId: string;
  objectKey: string;
  partSize: number;
  totalParts: number;
  expiresAt: string;
}

export interface SignMaterialUploadPartDto {
  materialId: string;
  uploadSessionId: string;
  uploadId: string;
  objectKey: string;
  partNumber: number;
}

export interface MaterialUploadPartSignedResponse {
  partNumber: number;
  url: string;
}

export interface CompleteMaterialUploadPart {
  partNumber: number;
  etag: string;
}

export interface CompleteMaterialUploadDto {
  materialId: string;
  uploadSessionId: string;
  uploadId: string;
  objectKey: string;
  parts: CompleteMaterialUploadPart[];
}

export interface AbortMaterialUploadDto {
  materialId: string;
  uploadSessionId: string;
  uploadId: string;
  objectKey: string;
}

export interface MaterialUploadAbortResponse {
  materialId: string;
  uploadSessionId: string;
  status: string;
}

export interface MaterialResponse {
  id: string;
  workspaceId: string;
  title: string;
  downloadUrl: string;
  status: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  category: MaterialCategory;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialSummary {
  id: string;
  title: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  category: MaterialCategory;
  downloadUrl: string;
}

export interface MaterialDeleteResponse {
  materialId: string;
}