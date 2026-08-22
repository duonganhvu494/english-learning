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
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { ResendEmailOtpDto } from "./dto/resend-email-otp.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailOtpDto } from "./dto/verify-email-otp.dto";
import { ConfigService } from "@nestjs/config";
import { ApiResponse } from "src/common/dto/api-response.dto";
import type { CookieOptions, Request, Response } from "express";
import type { AuthRequest } from "./interfaces/auth-request.interface";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { parseDurationToMs } from "src/common/utils/duration.util";
import type { RequestWithCookies } from "./interfaces/request-cookie.interface";
import { AuthSecurityService } from "./auth-security.service";
import { UserProfileResponse } from "src/users/dto/user-profile-response.dto";
import { CsrfTokenResponseDto } from "./dto/csrf-token-response.dto";
import { ChangePasswordResponseDto } from "./dto/change-password-response.dto";
import { ForgotPasswordResponseDto } from "./dto/forgot-password-response.dto";
import { OtpChallengeResponseDto } from "./dto/otp-challenge-response.dto";
import { ResetPasswordResponseDto } from "./dto/reset-password-response.dto";
import { VerifyEmailResponseDto } from "./dto/verify-email-response.dto";

@Controller("auth")
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
      this.config.get<string>("jwt.expiresIn", "15m"),
      15 * 60 * 1000,
    );
  }

  private get refreshTokenMaxAgeMs(): number {
    return parseDurationToMs(
      this.config.get<string>("jwt.refreshExpiresIn", "7d"),
      7 * 24 * 60 * 60 * 1000,
    );
  }

  private setCookie(
    res: Response,
    name: string,
    value: string,
    maxAgeMs: number,
  ) {
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
    this.setCookie(res, "accessToken", accessToken, this.accessTokenMaxAgeMs);
    this.setCookie(
      res,
      "refreshToken",
      refreshToken,
      this.refreshTokenMaxAgeMs,
    );
    this.authSecurityService.issueCsrfCookie(res, this.refreshTokenMaxAgeMs);
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie("accessToken", this.baseCookieOptions);
    res.clearCookie("refreshToken", this.baseCookieOptions);
    this.authSecurityService.clearCsrfCookie(res);
  }

  @Get("csrf-token")
  getCsrfToken(
    @Res({ passthrough: true }) res: Response,
  ): ApiResponse<{ csrfToken: string; headerName: string }> {
    const csrfToken = this.authSecurityService.issueCsrfCookie(
      res,
      this.refreshTokenMaxAgeMs,
    );

    return ApiResponse.success(
      {
        csrfToken,
        headerName: this.authSecurityService.csrfHeaderName,
      },
      "CSRF token issued",
    );
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const identifier = body.identifier ?? body.userName ?? "";
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      identifier,
      body.password,
      req.ip,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.success(user, "Login successful");
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    const { accessToken, refreshToken } = await this.authService.refreshSession(
      req.user,
    );

    this.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.success(null, "Session refreshed");
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    await this.authService.logout(
      req.cookies?.accessToken,
      req.cookies?.refreshToken,
    );
    this.clearAuthCookies(res);
    return ApiResponse.success(null, "Logged out");
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Req() req: AuthRequest): ApiResponse<UserProfileResponse> {
    const result = UserProfileResponse.fromData({
      id: req.user.userId,
      userName: req.user.userName ?? "",
      fullName: req.user.fullName ?? "",
      email: req.user.email,
      mustChangePassword: req.user.mustChangePassword ?? false,
      emailVerified: req.user.emailVerified ?? false,
      role: req.user.role ?? "",
      avatarUrl: undefined,
    });
    return ApiResponse.success(result, "Is authenticated");
  }

  @Post("verify-email-otp")
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
  ): Promise<ApiResponse<VerifyEmailResponseDto>> {
    const result = await this.authService.verifyEmailOtp(
      dto.registrationId,
      dto.otp,
    );
    return ApiResponse.success(result, "Email verified successfully");
  }

  @Post("resend-email-otp")
  @HttpCode(HttpStatus.OK)
  async resendEmailVerificationOtp(
    @Body() dto: ResendEmailOtpDto,
  ): Promise<ApiResponse<OtpChallengeResponseDto>> {
    const result = await this.authService.resendEmailVerificationOtp(dto.email);
    return ApiResponse.success(result, "Verification OTP sent");
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ApiResponse<ForgotPasswordResponseDto>> {
    const result = await this.authService.forgotPassword(dto.email);
    return ApiResponse.success(
      result,
      "Password reset OTP sent if the account exists",
    );
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiResponse<ResetPasswordResponseDto>> {
    const result = await this.authService.resetPasswordWithOtp(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    return ApiResponse.success(result, "Password reset successfully");
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<ApiResponse<{ user: UserProfileResponse }>> {
    const result = await this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
      (req as RequestWithCookies).cookies?.refreshToken,
    );
    return ApiResponse.success(result, "Password changed successfully");
  }
}
