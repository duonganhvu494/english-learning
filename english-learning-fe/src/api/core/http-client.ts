import { env } from "@/config/env";
import { ApiError } from "@/api/core/api-error";
import type { ApiResponse } from "@/api/core/api-types";

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null;
  }

  return response.json();
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

async function request<T>(path: string, options: RequestOptions = {}) {
  const { body, headers, ...restOptions } = options;
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...restOptions,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = (await parseJson(response)) as ApiResponse<T> | null;

  if (!response.ok) {
    const message = readMessage(payload, response.statusText);
    const code = readCode(payload);
    throw new ApiError(response.status, message, code);
  }

  if (!payload) {
    throw new ApiError(response.status, "Response is not valid JSON");
  }

  return payload;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  remove: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
