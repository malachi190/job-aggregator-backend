import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EnvService } from '../config/env.service';

@Injectable()
export class RefreshCookieService {
  constructor(private readonly env: EnvService) {}

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private get name(): string {
    // The __Host- prefix prevents Domain scoping in production. Browsers require
    // Secure for that prefix, so local HTTP development uses an unprefixed name.
    return this.isProduction ? '__Host-refresh_token' : 'refresh_token';
  }

  private get options() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };
  }

  set(response: Response, token: string): void {
    response.cookie(this.name, token, {
      ...this.options,
      maxAge: this.env.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000,
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.name, this.options);
  }

  get(request: Request): string | undefined {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    for (const cookie of cookieHeader.split(';')) {
      const separator = cookie.indexOf('=');
      if (separator === -1) continue;

      const name = cookie.slice(0, separator).trim();
      if (name !== this.name) continue;

      const value = cookie.slice(separator + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return undefined;
      }
    }

    return undefined;
  }
}
