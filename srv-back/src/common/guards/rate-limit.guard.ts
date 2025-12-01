import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Rate limiting configuration decorator
 */
export const RateLimit = (options: { maxRequests: number; windowMs: number; message?: string }) =>
  Reflect.metadata('rateLimit', options);

/**
 * Rate limiting guard using in-memory store
 * For production, consider using Redis for distributed rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitOptions = this.reflector.get<{
      maxRequests: number;
      windowMs: number;
      message?: string;
    }>('rateLimit', context.getHandler());

    if (!rateLimitOptions) {
      // No rate limit configured for this endpoint
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip; // Rate limit by user ID or IP

    const key = `${userId}:${request.route.path}`;
    const now = Date.now();

    let record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      record = {
        count: 1,
        resetTime: now + rateLimitOptions.windowMs,
      };
      this.requests.set(key, record);
      return true;
    }

    if (record.count >= rateLimitOptions.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            rateLimitOptions.message || `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment counter
    record.count++;
    this.requests.set(key, record);

    return true;
  }

  /**
   * Cleanup old entries periodically (call from cron job)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}
