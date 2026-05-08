import axios from "axios";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import type { ApiEnvelope, ApiErrorResult } from "@/types";
import {
  getCsrfHeaderName,
  getCsrfToken,
  setCsrfHeaderName,
  setCsrfToken,
} from "@/app/utils/client-storage";

export const API_BASE_URL =
  import.meta.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5001";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

type CsrfIssueResult = {
  csrfToken: string;
  headerName: string;
};

type RetryableConfig = AxiosRequestConfig & {
  _csrfRetried?: boolean;
};

const csrfClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

async function issueCsrfToken(): Promise<string | null> {
  try {
    const response =
      await csrfClient.get<ApiEnvelope<CsrfIssueResult>>("/auth/csrf-token");
    const result = response.data?.result;
    if (!result?.csrfToken) {
      return null;
    }

    setCsrfToken(result.csrfToken);
    setCsrfHeaderName(result.headerName || "x-csrf-token");
    return result.csrfToken;
  } catch {
    return null;
  }
}

http.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  const isWriteMethod =
    method !== "get" && method !== "head" && method !== "options";
  if (!isWriteMethod) {
    return config;
  }

  let csrfToken = getCsrfToken();
  if (!csrfToken) {
    csrfToken = await issueCsrfToken();
  }

  if (!csrfToken) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers[getCsrfHeaderName()] = csrfToken;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const config = (error.config ?? {}) as RetryableConfig;
    const method = (config.method ?? "get").toLowerCase();
    const isWriteMethod =
      method !== "get" && method !== "head" && method !== "options";
    const isCsrfError =
      error.response?.status === 403 &&
      error.response?.data?.code === "AUTH_CSRF_INVALID";
    const isCsrfIssueRequest = config.url?.includes("/auth/csrf-token");

    if (
      !isWriteMethod ||
      !isCsrfError ||
      config._csrfRetried ||
      isCsrfIssueRequest
    ) {
      throw error;
    }

    const freshToken = await issueCsrfToken();
    if (!freshToken) {
      throw error;
    }

    config._csrfRetried = true;
    config.headers = config.headers ?? {};
    config.headers[getCsrfHeaderName()] = freshToken;
    return http.request(config);
  },
);

export async function unwrap<T>(
  request: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  const response = await request;
  return response.data.result;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Request failed",
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const axiosError = error as AxiosError<ApiErrorResult>;
  const backendMessage = axiosError.response?.data?.message;
  const backendCode = axiosError.response?.data?.code;

  if (backendCode && backendMessage) {
    return `${backendMessage}`;
  }

  return backendMessage ?? fallbackMessage;
}

export function requestConfig(
  config?: AxiosRequestConfig,
): AxiosRequestConfig | undefined {
  return config;
}

export function resolveApiUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${normalizedBase}${normalizedPath}`;
}
