import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code returned by the API',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Human-readable error message',
  })
  message: string;

  @ApiProperty({
    type: 'null',
    nullable: true,
    example: null,
    description: 'Error responses always return null result',
  })
  result: null;

  @ApiProperty({
    example: 'VALIDATION_ERROR',
    description: 'Business error code for frontend error handling and i18n',
  })
  code: string;
}
