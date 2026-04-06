import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'teacher01 or teacher@example.com',
    description: 'Preferred login identifier. Accepts either username or email.',
  })
  @ValidateIf((object: LoginDto) => !object.userName)
  @IsString({ message: 'Identifier is not valid' })
  identifier?: string;

  @ApiPropertyOptional({
    example: 'teacher01',
    description:
      'Legacy login field kept for backward compatibility. Prefer identifier instead.',
  })
  @IsOptional()
  @IsString({ message: 'Username is not valid' })
  userName?: string;

  @ApiProperty({
    example: 'password123',
    description: 'Account password',
  })
  @IsString({ message: 'Password is not valid' })
  password: string;
}
