import type { UserProfile } from './users';

export interface VerifyEmailOtpDto {
  registrationId: string;
  otp: string;
}

export interface ResendEmailOtpDto {
  registrationId: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ForgotPasswordResponse {
  sent: boolean;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  user: UserProfile;
}

export interface VerifyEmailResponse {
  emailVerified: boolean;
  user: UserProfile;
}

export interface OtpChallengeResponse {
  email: string;
  expiresAt: string;
}