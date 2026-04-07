import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import type { CookieOptions, Request, Response } from 'express';
import type { AuthRequest } from './interfaces/auth-request.interface';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { parseDurationToMs } from 'src/common/utils/duration.util';
import type { RequestWithCookies } from './interfaces/request-cookie.interface';
import { AuthSecurityService } from './auth-security.service';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import { CsrfTokenResponseDto } from './dto/csrf-token-response.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto';
import { OtpChallengeResponseDto } from './dto/otp-challenge-response.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { VerifyEmailResponseDto } from './dto/verify-email-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly authSecurityService: AuthSecurityService,
  ) {}

  private get baseCookieOptions(): CookieOptions {
    return this.authSecurityService.authCookieOptions;
  }

  private get accessTokenMaxAgeMs(): number {
    return parseDurationToMs(
      this.config.get<string>('jwt.expiresIn', '15m'),
      15 * 60 * 1000,
    );
  }

  private get refreshTokenMaxAgeMs(): number {
    return parseDurationToMs(
      this.config.get<string>('jwt.refreshExpiresIn', '7d'),
      7 * 24 * 60 * 60 * 1000,
    );
  }

  private setCookie(res: Response, name: string, value: string, maxAgeMs: number) {
    res.cookie(name, value, {
      ...this.baseCookieOptions,
      maxAge: maxAgeMs,
    });
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    this.setCookie(res, 'accessToken', accessToken, this.accessTokenMaxAgeMs);
    this.setCookie(
      res,
      'refreshToken',
      refreshToken,
      this.refreshTokenMaxAgeMs,
    );
    this.authSecurityService.issueCsrfCookie(res, this.refreshTokenMaxAgeMs);
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', this.baseCookieOptions);
    res.clearCookie('refreshToken', this.baseCookieOptions);
    this.authSecurityService.clearCsrfCookie(res);
  }

  @Get('csrf-token')
  @ApiOperation({
    summary: 'Issue CSRF token',
    description:
      'Returns a CSRF token and also sets the CSRF cookie used by authenticated write requests.',
  })
  @ApiEnvelopeResponse({
    status: 200,
    description: 'CSRF token issued successfully',
    model: CsrfTokenResponseDto,
    exampleMessage: 'CSRF token issued',
    exampleResult: {
      csrfToken: 'n6gI9kA0J2Q1F0kD7Y5cG8uGm8uA6l7pB3rN4xS5tU0',
      headerName: 'x-csrf-token',
    },
  })
  getCsrfToken(@Res({ passthrough: true }) res: Response): ApiResponse<{ csrfToken: string; headerName: string; }> {
    const csrfToken = this.authSecurityService.issueCsrfCookie(
      res,
      this.refreshTokenMaxAgeMs,
    );

    return ApiResponse.success(
      {
        csrfToken,
        headerName: this.authSecurityService.csrfHeaderName,
      },
      'CSRF token issued',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticates a user by username or email and sets accessToken, refreshToken, and csrfToken cookies.',
  })
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Login successful',
    model: UserProfileResponse,
    exampleMessage: 'Login successful',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'teacher01',
      fullName: 'Duong Anh Vu',
      email: 'duonganhvu@example.com',
      mustChangePassword: false,
      emailVerified: true,
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or account access denied' })
  @ApiBusinessErrorResponses([
    {
      status: 401,
      code: 'AUTH_USERNAME_NOT_REGISTERED',
      message: 'Username or email is not registered',
    },
    {
      status: 401,
      code: 'AUTH_PASSWORD_INCORRECT',
      message: 'Password is incorrect',
    },
    {
      status: 401,
      code: 'AUTH_ACCOUNT_DISABLED',
      message: 'Account is disabled',
    },
    {
      status: 401,
      code: 'AUTH_EMAIL_NOT_VERIFIED',
      message: 'Email verification is required before login',
    },
    {
      status: 429,
      code: 'AUTH_LOGIN_RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    },
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
  ])
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough : true}) res: Response,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const identifier = body.identifier ?? body.userName ?? '';
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      identifier,
      body.password,
      req.ip,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.success(user, 'Login successful');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({
    summary: 'Refresh session',
    description:
      'Refreshes the authenticated session using the refresh token cookie and rotates auth cookies.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session refreshed successfully',
    exampleMessage: 'Session refreshed',
    exampleResult: null,
  })
  @ApiUnauthorizedResponse({ description: 'Refresh token is invalid or expired' })
  @ApiForbiddenResponse({ description: 'CSRF token is missing or invalid' })
  @ApiBusinessErrorResponses([
    {
      status: 401,
      code: 'AUTH_REFRESH_SESSION_INVALID',
      message: 'Invalid refresh session',
    },
    {
      status: 401,
      code: 'AUTH_ACCOUNT_DISABLED',
      message: 'Account is disabled',
    },
    {
      status: 403,
      code: 'AUTH_CSRF_INVALID',
      message: 'CSRF token is missing or invalid',
    },
  ])
  async refreshToken(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    const { accessToken, refreshToken } = await this.authService.refreshSession(
      req.user,
    );

    this.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.success(null, 'Session refreshed');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Clears authentication cookies and invalidates the current session.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Logged out successfully',
    exampleMessage: 'Logged out',
    exampleResult: null,
  })
  @ApiForbiddenResponse({ description: 'CSRF token is missing or invalid' })
  @ApiBusinessErrorResponses([
    {
      status: 403,
      code: 'AUTH_CSRF_INVALID',
      message: 'CSRF token is missing or invalid',
    },
  ])
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    await this.authService.logout(
      req.cookies?.accessToken,
      req.cookies?.refreshToken,
    );
    this.clearAuthCookies(res);
    return ApiResponse.success(null, 'Logged out');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the currently authenticated user profile.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Authenticated user retrieved successfully',
    model: UserProfileResponse,
    exampleMessage: 'Is authenticated',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'teacher01',
      fullName: 'Duong Anh Vu',
      email: 'duonganhvu@example.com',
      mustChangePassword: false,
      emailVerified: true,
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiBusinessErrorResponses([
    {
      status: 401,
      code: 'AUTH_UNAUTHORIZED',
      message: 'Unauthorized',
    },
  ])
  getMe(@Req() req: AuthRequest): ApiResponse<UserProfileResponse> {
    const result = UserProfileResponse.fromData({
      id: req.user.userId,
      userName: req.user.userName ?? '',
      fullName: req.user.fullName ?? '',
      email: req.user.email,
      mustChangePassword: req.user.mustChangePassword ?? false,
      emailVerified: req.user.emailVerified ?? false,
    });
    return ApiResponse.success(result, 'Is authenticated');
  }

  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP',
    description:
      'Verifies a registered email address by checking the OTP sent to the user inbox.',
  })
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Email verified successfully',
    model: VerifyEmailResponseDto,
    exampleMessage: 'Email verified successfully',
    exampleResult: {
      emailVerified: true,
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userName: 'teacher01',
        fullName: 'Duong Anh Vu',
        email: 'duonganhvu@example.com',
        mustChangePassword: false,
        emailVerified: true,
      },
    },
  })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'AUTH_EMAIL_VERIFICATION_INVALID',
      message: 'Verification request is invalid',
    },
    {
      status: 400,
      code: 'AUTH_EMAIL_VERIFICATION_OTP_INVALID',
      message: 'Verification OTP is invalid',
    },
    {
      status: 400,
      code: 'AUTH_EMAIL_VERIFICATION_OTP_EXPIRED',
      message: 'Verification OTP has expired',
    },
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
  ])
  async verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
  ): Promise<ApiResponse<VerifyEmailResponseDto>> {
    const result = await this.authService.verifyEmailOtp(dto.email, dto.otp);
    return ApiResponse.success(result, 'Email verified successfully');
  }

  @Post('resend-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification OTP',
    description: 'Issues and sends a new verification OTP for an unverified account.',
  })
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Verification OTP sent successfully',
    model: OtpChallengeResponseDto,
    exampleMessage: 'Verification OTP sent',
    exampleResult: {
      email: 'duonganhvu@example.com',
      expiresAt: '2026-04-06T10:15:00.000Z',
    },
  })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'AUTH_EMAIL_NOT_REGISTERED',
      message: 'Email is not registered',
    },
    {
      status: 400,
      code: 'AUTH_EMAIL_ALREADY_VERIFIED',
      message: 'Email is already verified',
    },
    {
      status: 400,
      code: 'AUTH_EMAIL_VERIFICATION_UNAVAILABLE',
      message: 'Unable to issue verification OTP',
    },
    {
      status: 401,
      code: 'AUTH_ACCOUNT_DISABLED',
      message: 'Account is disabled',
    },
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
  ])
  async resendEmailVerificationOtp(
    @Body() dto: ResendEmailOtpDto,
  ): Promise<ApiResponse<OtpChallengeResponseDto>> {
    const result = await this.authService.resendEmailVerificationOtp(dto.email);
    return ApiResponse.success(result, 'Verification OTP sent');
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      'Generates and sends a password reset OTP to the provided email address.',
  })
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Password reset OTP request accepted',
    model: ForgotPasswordResponseDto,
    exampleMessage: 'Password reset OTP sent if the account exists',
    exampleResult: {
      sent: true,
    },
  })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
  ])
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ApiResponse<ForgotPasswordResponseDto>> {
    const result = await this.authService.forgotPassword(dto.email);
    return ApiResponse.success(
      result,
      'Password reset OTP sent if the account exists',
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with OTP',
    description:
      'Resets the password of an account by validating the email-based password reset OTP.',
  })
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Password reset successfully',
    model: ResetPasswordResponseDto,
    exampleMessage: 'Password reset successfully',
    exampleResult: {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        userName: 'student01',
        fullName: 'Nguyen Van A',
        email: 'student01@example.com',
        mustChangePassword: false,
        emailVerified: true,
      },
    },
  })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'AUTH_PASSWORD_RESET_OTP_INVALID',
      message: 'Password reset OTP is invalid',
    },
    {
      status: 400,
      code: 'AUTH_PASSWORD_RESET_OTP_EXPIRED',
      message: 'Password reset OTP has expired',
    },
    {
      status: 400,
      code: 'AUTH_NEW_PASSWORD_MUST_DIFFERENT',
      message: 'New password must be different from current password',
    },
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
  ])
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiResponse<ResetPasswordResponseDto>> {
    const result = await this.authService.resetPasswordWithOtp(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    return ApiResponse.success(result, 'Password reset successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description:
      'Changes the password of the currently authenticated user. Also used for first-login forced password change.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Password changed successfully',
    model: ChangePasswordResponseDto,
    exampleMessage: 'Password changed successfully',
    exampleResult: {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        userName: 'student01',
        fullName: 'Nguyen Van A',
        email: 'student01@example.com',
        mustChangePassword: false,
        emailVerified: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'CSRF token is missing or invalid' })
  @ApiBusinessErrorResponses([
    {
      status: 401,
      code: 'AUTH_UNAUTHORIZED',
      message: 'Unauthorized',
    },
    {
      status: 401,
      code: 'AUTH_CURRENT_PASSWORD_INCORRECT',
      message: 'Current password is incorrect',
    },
    {
      status: 400,
      code: 'AUTH_NEW_PASSWORD_MUST_DIFFERENT',
      message: 'New password must be different from current password',
    },
    {
      status: 403,
      code: 'AUTH_CSRF_INVALID',
      message: 'CSRF token is missing or invalid',
    },
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
  ])
  async changePassword(
    @Req() req: AuthRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<ApiResponse<{ user: UserProfileResponse; }>> {
    const result = await this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
      (req as RequestWithCookies).cookies?.refreshToken,
    );
    return ApiResponse.success(result, 'Password changed successfully');
  }
}
