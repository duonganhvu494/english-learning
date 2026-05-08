export interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  result: T;
  code?: string;
}

export interface ApiErrorResult {
  statusCode?: number;
  message?: string;
  code?: string;
}

export type Nullable<T> = T | null;
