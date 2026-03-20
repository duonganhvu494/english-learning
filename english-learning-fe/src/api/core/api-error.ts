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
