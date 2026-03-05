import { Controller, Post, Body, Res, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import type { CookieOptions, Response } from 'express';
import type { StringValue } from 'ms';
import type { AuthRequest } from './interfaces/auth-request.interface';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private jwtService: JwtService,
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

  private setCookie(res: Response, name: string, value: string, minute = 60) {
    res.cookie(name, value, {
      ...this.baseCookieOptions,
      maxAge: minute * 60 * 1000,
    });
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ) {
    this.setCookie(res, 'accessToken', accessToken, 60);
    this.setCookie(res, 'refreshToken', refreshToken, 7 * 24 * 60);
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', this.baseCookieOptions);
    res.clearCookie('refreshToken', this.baseCookieOptions);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough : true}) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.signIn(body.userName, body.password);
    this.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.success(user, 'Login successful');
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh_token(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const payload = req.user;
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret', 'localhost'),
      expiresIn: this.config.get<string>('jwt.expiresIn', '15m') as StringValue,
    });
    this.setCookie(res, 'accessToken', accessToken, 60);
    return ApiResponse.success(null, 'Access token refreshed');
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
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
