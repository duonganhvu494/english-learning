import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyEmailOtpDto {
  @ApiProperty({
    example: 'teacher@example.com',
    description: 'Email address of the account to verify',
  })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP sent to the email address',
  })
  @IsNotEmpty({ message: 'OTP can not be empty' })
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp: string;
}
