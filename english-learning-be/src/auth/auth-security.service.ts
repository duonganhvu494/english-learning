import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';
import type { RequestWithCookies } from './interfaces/request-cookie.interface';

@Injectable()
export class AuthSecurityService {
  constructor(private readonly config: ConfigService) {}

  get csrfCookieName(): string {
    return this.config.getOrThrow<string>('security.csrfCookieName');
  }

  get csrfHeaderName(): string {
    return this.config.getOrThrow<string>('security.csrfHeaderName').toLowerCase();
  }

  get allowedCorsOrigins(): string[] {
    return this.config.get<string[]>('app.cors.allowedOrigins', []);
  }

  get cookieSecure(): boolean {
    return this.config.getOrThrow<boolean>('cookie.secure');
  }

  get cookieSameSite(): CookieOptions['sameSite'] {
    const sameSite = this.config.getOrThrow<string>('cookie.sameSite').toLowerCase();

    if (sameSite === 'none' || sameSite === 'strict' || sameSite === 'lax') {
      if (sameSite === 'none' && !this.cookieSecure) {
        throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
      }

      return sameSite;
    }

    return 'lax';
  }

  get authCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure: this.cookieSecure,
      path: '/',
    };
  }

  get csrfCookieOptions(): CookieOptions {
    return {
      httpOnly: false,
      sameSite: this.cookieSameSite,
      secure: this.cookieSecure,
      path: '/',
    };
  }

  assertCookieSecurityConfig(): void {
    void this.cookieSameSite;
  }

  issueCsrfCookie(res: Response, maxAgeMs?: number): string {
    const csrfToken = this.generateCsrfToken();
    res.cookie(this.csrfCookieName, csrfToken, {
      ...this.csrfCookieOptions,
      ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
    });

    return csrfToken;
  }

  clearCsrfCookie(res: Response): void {
    res.clearCookie(this.csrfCookieName, this.csrfCookieOptions);
  }

  isSafeMethod(method: string): boolean {
    const normalizedMethod = method.toUpperCase();
    return (
      normalizedMethod === 'GET' ||
      normalizedMethod === 'HEAD' ||
      normalizedMethod === 'OPTIONS'
    );
  }

  hasAuthCookies(req: RequestWithCookies): boolean {
    return Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  }

  hasValidCsrfToken(req: RequestWithCookies): boolean {
    const cookieToken = req.cookies?.[this.csrfCookieName];
    const headerToken = this.readCsrfHeader(req);

    if (!cookieToken || !headerToken) {
      return false;
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    if (cookieBuffer.length !== headerBuffer.length) {
      return false;
    }

    return timingSafeEqual(cookieBuffer, headerBuffer);
  }

  private generateCsrfToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private readCsrfHeader(req: Request): string | null {
    const rawValue = req.headers[this.csrfHeaderName];
    if (Array.isArray(rawValue)) {
      return rawValue[0] ?? null;
    }

    return typeof rawValue === 'string' ? rawValue : null;
  }
}
