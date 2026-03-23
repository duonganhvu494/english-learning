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
import { LoginDto } from './dto/login.dto';
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
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
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
      'Authenticates a user and sets accessToken, refreshToken, and csrfToken cookies.',
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
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or account access denied' })
  @ApiBusinessErrorResponses([
    {
      status: 401,
      code: 'AUTH_USERNAME_NOT_REGISTERED',
      message: 'Username is not registered',
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
  ) {
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      body.userName,
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
  async refresh_token(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
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
  ) {
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
  getMe(@Req() req: AuthRequest) {
    const result = UserProfileResponse.fromData({
      id: req.user.userId,
      userName: req.user.userName ?? '',
      fullName: req.user.fullName ?? '',
      email: req.user.email,
      mustChangePassword: req.user.mustChangePassword ?? false,
    });
    return ApiResponse.success(result, 'Is authenticated');
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
  ) {
    const result = await this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return ApiResponse.success(result, 'Password changed successfully');
  }
}
