export class ApiResponse<T> {
  statusCode: number;
  message: string;
  result: T;
  code?: string;

  constructor(statusCode: number, message: string, result: T, code?: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.result = result;

    if (code) {
      this.code = code;
    }
  }

  static success<T>(
    result: T,
    message = 'Success',
    statusCode = 200,
    code?: string,
  ) {
    return new ApiResponse<T>(statusCode, message, result, code);
  }

  static error(statusCode: number, message: string, code?: string) {
    return new ApiResponse<null>(statusCode, message, null, code);
  }
}
