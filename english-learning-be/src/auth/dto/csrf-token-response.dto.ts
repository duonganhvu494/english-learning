import { ApiProperty } from '@nestjs/swagger';

export class CsrfTokenResponseDto {
  @ApiProperty({
    example: '0d8f0b79-8db0-41f0-8a6a-2a0dbf6e15a6',
    description: 'Issued CSRF token that must be echoed in the configured CSRF header',
  })
  csrfToken: string;

  @ApiProperty({
    example: 'x-csrf-token',
    description: 'Header name expected by the backend for CSRF-protected requests',
  })
  headerName: string;
}
