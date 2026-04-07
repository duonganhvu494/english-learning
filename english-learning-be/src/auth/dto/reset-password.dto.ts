import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'teacher@example.com',
    description: 'Email address of the account resetting the password',
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

  @ApiProperty({
    example: 'new-secure-password',
    description: 'New password with at least 6 characters',
    minLength: 6,
  })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @IsNotEmpty({ message: 'New password can not be empty' })
  newPassword: string;
}
