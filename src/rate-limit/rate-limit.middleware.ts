import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import { RATE_LIMITS } from './rate-limit.config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async use(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const rule = this.resolveRule(request);
    const identifier = request.ip || request.socket.remoteAddress || 'unknown';
    const windowId = Math.floor(Date.now() / rule.ttl);
    const key = `rate-limit:${rule.name}:${identifier}:${windowId}`;

    try {
      const results = await this.redis
        .multi()
        .incr(key)
        .pexpire(key, rule.ttl, 'NX')
        .exec();
      const count = Number(results?.[0]?.[1] ?? 0);
      const remaining = Math.max(0, rule.limit - count);

      response.setHeader('X-RateLimit-Limit', rule.limit);
      response.setHeader('X-RateLimit-Remaining', remaining);

      if (count > rule.limit) {
        response.setHeader('Retry-After', Math.ceil(rule.ttl / 1000));
        response.status(429).json({
          status: false,
          message: 'Too many requests. Please try again later.',
        });
        return;
      }
    } catch (error) {
      // Availability takes precedence if Redis is temporarily unavailable.
      this.logger.warn(
        `Rate limiter unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    next();
  }

  private resolveRule(request: Request) {
    if (request.path.startsWith('/auth/')) {
      return { name: 'auth', ...RATE_LIMITS.auth };
    }
    if (request.path.startsWith('/tailoring/')) {
      return { name: 'tailoring', ...RATE_LIMITS.tailoring };
    }
    if (
      request.path.startsWith('/base-cvs') &&
      ['POST', 'DELETE'].includes(request.method)
    ) {
      return { name: 'upload', ...RATE_LIMITS.upload };
    }
    return { name: 'default', ...RATE_LIMITS.default };
  }
}
