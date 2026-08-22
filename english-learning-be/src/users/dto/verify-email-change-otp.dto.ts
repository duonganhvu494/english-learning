import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailChangeOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'OTP can not be empty' })
  @Length(6, 6, {
    message: 'OTP must be exactly 6 characters',
  })
  otp: string;
}