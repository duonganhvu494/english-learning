import { IsEmail } from 'class-validator';

export class ResendEmailOtpDto {
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
