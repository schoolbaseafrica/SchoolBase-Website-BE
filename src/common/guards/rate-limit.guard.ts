import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  RATE_LIMIT_KEY,
  IRateLimitOptions,
} from '../decorators/rate-limit.decorator';

/**
 * Simple in-memory rate limiter for public endpoints
 * For production, consider using @nestjs/throttler or Redis-based rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, number[]>();
  private readonly defaultMaxRequests = 10;
  private readonly defaultWindowMs = 60000; // 1 minute

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get rate limit options from decorator
    const options = this.reflector.getAllAndOverride<IRateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const maxRequests = options?.maxRequests || this.defaultMaxRequests;
    const windowMs = options?.windowMs || this.defaultWindowMs;

    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    const now = Date.now();

    // Clean up old entries
    this.cleanup(now, windowMs);

    // Get or create request history for this IP
    const requests = this.requests.get(ip) || [];
    const recentRequests = requests.filter(
      (timestamp) => now - timestamp < windowMs,
    );

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    return true;
  }

  private getClientIp(request: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    connection?: { remoteAddress?: string };
  }): string {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;
    const ip =
      (typeof forwardedIp === 'string' ? forwardedIp.split(',')[0] : null) ||
      (typeof request.headers?.['x-real-ip'] === 'string'
        ? request.headers['x-real-ip']
        : null) ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown';
    return ip.trim();
  }

  private cleanup(now: number, windowMs: number): void {
    // Clean up entries older than the window
    for (const [ip, requests] of this.requests.entries()) {
      const recent = requests.filter((timestamp) => now - timestamp < windowMs);
      if (recent.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recent);
      }
    }
  }
}
