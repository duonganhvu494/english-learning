import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendEmailOtpDto {
  @ApiProperty({
    example: 'teacher@example.com',
    description: 'Email address of the account that needs a new verification OTP',
  })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
