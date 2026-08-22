import { IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyEmailOtpDto {
  @IsString()
  @IsNotEmpty({ message: "Registration ID can not be empty" })
  registrationId: string;

  @IsNotEmpty({ message: "OTP can not be empty" })
  @Length(6, 6, { message: "OTP must be exactly 6 characters" })
  otp: string;
}
