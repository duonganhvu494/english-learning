import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyEmailOtpDto {
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @IsNotEmpty({ message: 'OTP can not be empty' })
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp: string;
}
