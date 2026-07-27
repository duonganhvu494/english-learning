import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @IsNotEmpty({ message: 'OTP can not be empty' })
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp: string;

  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @IsNotEmpty({ message: 'New password can not be empty' })
  newPassword: string;
}
