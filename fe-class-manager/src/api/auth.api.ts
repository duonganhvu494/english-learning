import { clearAuthStorage, setCsrfHeaderName, setCsrfToken } from '@/app/utils/client-storage';
import type {
  CsrfTokenResult,
  ForgotPasswordDto,
  ForgotPasswordResponse,
  LoginDto,
  OtpChallengeResponse,
  ResendEmailOtpDto,
  ResetPasswordDto,
  ResetPasswordResponse,
  UserProfile,
  VerifyEmailOtpDto,
  VerifyEmailResponse,
} from '@/types';
import { http, unwrap } from './http';

let csrfPromise: Promise<CsrfTokenResult> | null = null;

export const authApi = {
  async getCsrfToken(): Promise<CsrfTokenResult> {
    const result = await unwrap<CsrfTokenResult>(
      http.get('/auth/csrf-token'),
    );
    setCsrfToken(result.csrfToken);
    setCsrfHeaderName(result.headerName || 'x-csrf-token');
    return result;
  },

  async ensureCsrfToken(): Promise<CsrfTokenResult> {
    if (!csrfPromise) {
      csrfPromise = this.getCsrfToken().finally(() => {
        csrfPromise = null;
      });
    }
    return csrfPromise;
  },

  async login(payload: LoginDto): Promise<UserProfile> {
    await this.ensureCsrfToken();
    const user = await unwrap<UserProfile>(http.post('/auth/login', payload));

    // Backend rotates csrf cookie on successful login, refresh FE copy immediately.
    await this.getCsrfToken();
    return user;
  },

  async logout(): Promise<void> {
    await this.ensureCsrfToken();
    await unwrap<null>(http.post('/auth/logout'));
    clearAuthStorage();
  },

  async verifyEmailOtp(payload: VerifyEmailOtpDto): Promise<VerifyEmailResponse> {
    return unwrap<VerifyEmailResponse>(
      http.post('/auth/verify-email-otp', payload),
    );
  },

  async resendEmailOtp(payload: ResendEmailOtpDto): Promise<OtpChallengeResponse> {
    return unwrap<OtpChallengeResponse>(
      http.post('/auth/resend-email-otp', payload),
    );
  },

  async forgotPassword(payload: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    return unwrap<ForgotPasswordResponse>(
      http.post('/auth/forgot-password', payload),
    );
  },

  async resetPassword(payload: ResetPasswordDto): Promise<ResetPasswordResponse> {
    return unwrap<ResetPasswordResponse>(
      http.post('/auth/reset-password', payload),
    );
  },
};
