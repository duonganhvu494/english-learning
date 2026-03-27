import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { createApiError } from "@/api/core/api-error";
import type { ApiResponse } from "@/types/api";

type RequestOptions = Omit<AxiosRequestConfig, "url" | "method" | "data">;
type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _csrfRetried?: boolean;
};

const DEFAULT_CSRF_COOKIE_NAME = "csrfToken";
const DEFAULT_CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_EXEMPT_PATHS = new Set(["/auth/login", "/users/register"]);
const CSRF_TOKEN_PATH = "/auth/csrf-token";
const REFRESH_PATH = "/auth/refresh";
const NO_REFRESH_PATHS = new Set([
  "/auth/login",
  "/users/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/csrf-token",
]);

let csrfHeaderName = DEFAULT_CSRF_HEADER_NAME;
let csrfTokenPromise: Promise<string | null> | null = null;
let refreshPromise: Promise<void> | null = null;

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isSafeMethod(method: string) {
  const normalizedMethod = method.toUpperCase();
  return (
    normalizedMethod === "GET" ||
    normalizedMethod === "HEAD" ||
    normalizedMethod === "OPTIONS"
  );
}

function getPathname(path: string | undefined) {
  if (!path) {
    return "";
  }

  try {
    return new URL(path, process.env.NEXT_PUBLIC_API_BASE_URL).pathname;
  } catch {
    return path;
  }
}

function shouldAttachCsrf(config: InternalAxiosRequestConfig) {
  const method = config.method ?? "GET";
  if (isSafeMethod(method)) {
    return false;
  }

  return !CSRF_EXEMPT_PATHS.has(getPathname(config.url));
}

function shouldRefresh(pathname: string) {
  return !NO_REFRESH_PATHS.has(pathname);
}

function isFormDataPayload(payload: unknown) {
  return typeof FormData !== "undefined" && payload instanceof FormData;
}

function readCookieValue(name: string) {
  if (!isBrowser() || !document.cookie) {
    return null;
  }

  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const cookieName = decodeURIComponent(cookie.slice(0, separatorIndex));
    if (cookieName !== name) {
      continue;
    }

    return decodeURIComponent(cookie.slice(separatorIndex + 1));
  }

  return null;
}

function readMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === "string" || Array.isArray(maybeMessage)) {
    return maybeMessage;
  }

  return fallback;
}

function readCode(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const maybeCode = (payload as { code?: unknown }).code;
  if (typeof maybeCode === "string") {
    return maybeCode;
  }

  return undefined;
}

async function ensureCsrfToken() {
  const existingToken = readCookieValue(DEFAULT_CSRF_COOKIE_NAME);
  if (existingToken) {
    return existingToken;
  }

  if (!isBrowser()) {
    return null;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = (async () => {
      try {
        const response = await apiClient.get<
          ApiResponse<{
            csrfToken?: string;
            headerName?: string;
          }>
        >(CSRF_TOKEN_PATH);

        const result = response.data?.result;
        if (result && typeof result === "object") {
          if (
            typeof result.headerName === "string" &&
            result.headerName.trim().length > 0
          ) {
            csrfHeaderName = result.headerName.toLowerCase();
          }

          if (
            typeof result.csrfToken === "string" &&
            result.csrfToken.trim().length > 0
          ) {
            return result.csrfToken;
          }
        }
      } catch {
        return null;
      }

      return readCookieValue(DEFAULT_CSRF_COOKIE_NAME);
    })().finally(() => {
      csrfTokenPromise = null;
    });
  }

  return csrfTokenPromise;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<ApiResponse<null>>(REFRESH_PATH)
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  const headers = AxiosHeaders.from(config.headers);
  const hasBody = config.data !== undefined && config.data !== null;

  if (
    hasBody &&
    !isFormDataPayload(config.data) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (shouldAttachCsrf(config) && !headers.has(csrfHeaderName)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set(csrfHeaderName, csrfToken);
    }
  }

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    throw error;
  }

  const config = error.config as RetryableConfig | undefined;
  const status = error.response?.status;
  const payload = error.response?.data;
  const pathname = getPathname(config?.url);
  const code = readCode(payload);

  if (
    config &&
    status === 403 &&
    code === "AUTH_CSRF_INVALID" &&
    !config._csrfRetried &&
    pathname !== CSRF_TOKEN_PATH
  ) {
    config._csrfRetried = true;
    await ensureCsrfToken();
    return apiClient.request(config);
  }

  if (config && status === 401 && !config._retry && shouldRefresh(pathname)) {
    config._retry = true;
    await refreshSession();
    return apiClient.request(config);
  }

  if (status !== undefined) {
    const fallback =
      error.response?.statusText || error.message || "Request failed";
    throw createApiError(status, readMessage(payload, fallback), code);
  }

  throw createApiError(0, error.message || "Network error");
});

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
) {
  const response = await apiClient.request<ApiResponse<T>>({
    ...options,
    method,
    url: path,
    data: body,
  });

  const payload = response.data;
  if (!payload || typeof payload !== "object") {
    throw createApiError(response.status, "Response is not valid JSON");
  }

  return payload;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  remove: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
