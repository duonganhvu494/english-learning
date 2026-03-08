import { Controller, Post, Body, Res, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import type { CookieOptions, Request, Response } from 'express';
import type { AuthRequest } from './interfaces/auth-request.interface';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { parseDurationToMs } from 'src/common/utils/duration.util';
import type { RequestWithCookies } from './interfaces/request-cookie.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get cookieSecure(): boolean {
    return this.config.get<boolean>('cookie.secure', false);
  }

  private get cookieSameSite(): CookieOptions['sameSite'] {
    const sameSite = this.config
      .get<string>('cookie.sameSite', 'lax')
      .toLowerCase();

    if (sameSite === 'none' || sameSite === 'strict' || sameSite === 'lax') {
      return sameSite;
    }

    return 'lax';
  }

  private get baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure: this.cookieSecure,
    };
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
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', this.baseCookieOptions);
    res.clearCookie('refreshToken', this.baseCookieOptions);
  }

  @Post('login')
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
  @UseGuards(JwtRefreshGuard)
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
  async getMe(@Req() req: AuthRequest) {
    const email = req.user.email;
    const result = await this.authService.me(email);
    return ApiResponse.success(result, 'Is authenticated');
  }
}
