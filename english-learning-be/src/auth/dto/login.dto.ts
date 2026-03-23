import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'teacher01',
    description: 'Username used to sign in',
  })
  @IsString({ message: 'Username is not valid' })
  userName: string;

  @ApiProperty({
    example: 'password123',
    description: 'Account password',
  })
  @IsString({ message: 'Password is not valid' })
  password: string;
}
