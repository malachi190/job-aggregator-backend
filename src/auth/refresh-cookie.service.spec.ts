import type { Request, Response } from 'express';
import { EnvService } from '../config/env.service';
import { RefreshCookieService } from './refresh-cookie.service';

describe('RefreshCookieService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const env = { jwtRefreshExpiryDays: 30 } as EnvService;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses a cross-site, host-only secure cookie in production', () => {
    process.env.NODE_ENV = 'production';
    const service = new RefreshCookieService(env);
    const response = { cookie: jest.fn() } as unknown as Response;

    service.set(response, 'refresh-value');

    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-refresh_token',
      'refresh-value',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it('reads the local-development cookie from the Cookie header', () => {
    process.env.NODE_ENV = 'development';
    const service = new RefreshCookieService(env);
    const request = {
      headers: { cookie: 'theme=dark; refresh_token=token%2Evalue' },
    } as Request;

    expect(service.get(request)).toBe('token.value');
  });

  it('clears a cookie using the same production scope', () => {
    process.env.NODE_ENV = 'production';
    const service = new RefreshCookieService(env);
    const response = { clearCookie: jest.fn() } as unknown as Response;

    service.clear(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      '__Host-refresh_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      }),
    );
  });
});
