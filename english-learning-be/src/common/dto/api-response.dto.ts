import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code returned by the API',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Success',
    description: 'Human-readable response message',
  })
  message: string;

  @ApiProperty({
    description: 'Wrapped response payload',
    nullable: true,
  })
  result: T;

  @ApiPropertyOptional({
    example: 'USER_NOT_FOUND',
    description: 'Optional business error code for frontend handling',
  })
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
