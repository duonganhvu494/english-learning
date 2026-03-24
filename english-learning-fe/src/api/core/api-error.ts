export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly details?: string | string[],
    public readonly code?: string,
  ) {
    super(typeof details === "string" ? details : "Request failed");
    this.name = "ApiError";
  }
}

export class AuthCsrfInvalidError extends ApiError {
  constructor(statusCode: number, details?: string | string[]) {
    super(statusCode, details, "AUTH_CSRF_INVALID");
    this.name = "AuthCsrfInvalidError";
  }
}

export function createApiError(
  statusCode: number,
  details?: string | string[],
  code?: string,
) {
  if (code === "AUTH_CSRF_INVALID") {
    return new AuthCsrfInvalidError(statusCode, details);
  }

  return new ApiError(statusCode, details, code);
}
