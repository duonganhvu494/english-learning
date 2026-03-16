export type ApiResponse<T> = {
  statusCode: number;
  message: string | string[];
  result: T;
};
