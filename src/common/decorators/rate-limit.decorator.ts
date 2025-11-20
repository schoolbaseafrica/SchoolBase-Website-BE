import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export interface IRateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

export const RateLimit = (options?: IRateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options || {});
