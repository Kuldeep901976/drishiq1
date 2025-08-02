import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private rules: { [endpoint: string]: RateLimitRule } = {
    '/api/verify-phone': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
    '/api/upload-image': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
    'default': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute default
  };

  private cleanupExpiredEntries() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getClientKey(request: NextRequest): string {
    // Use IP address as identifier
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return `rate_limit_${ip}`;
  }

  private getRuleForEndpoint(pathname: string): RateLimitRule {
    return this.rules[pathname] || this.rules['default'];
  }

  public async checkRateLimit(request: NextRequest): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    this.cleanupExpiredEntries();

    const clientKey = this.getClientKey(request);
    const rule = this.getRuleForEndpoint(request.nextUrl.pathname);
    const now = Date.now();
    const resetTime = now + rule.windowMs;

    if (!this.store[clientKey]) {
      this.store[clientKey] = {
        requests: 0,
        resetTime,
      };
    }

    const clientData = this.store[clientKey];

    // Reset if window has expired
    if (now > clientData.resetTime) {
      clientData.requests = 0;
      clientData.resetTime = resetTime;
    }

    clientData.requests++;

    const remaining = Math.max(0, rule.maxRequests - clientData.requests);
    const isAllowed = clientData.requests <= rule.maxRequests;

    return {
      success: isAllowed,
      limit: rule.maxRequests,
      remaining,
      reset: clientData.resetTime,
      retryAfter: isAllowed ? undefined : Math.ceil((clientData.resetTime - now) / 1000),
    };
  }

  public createRateLimitResponse(rateLimitResult: {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }): NextResponse {
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());

    if (!rateLimitResult.success && rateLimitResult.retryAfter) {
      headers.set('Retry-After', rateLimitResult.retryAfter.toString());
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers }
      );
    }

    return NextResponse.next({ headers });
  }
}

export const rateLimiter = new RateLimiter();

// Middleware helper function
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimitResult = await rateLimiter.checkRateLimit(request);
  
  if (!rateLimitResult.success) {
    return rateLimiter.createRateLimitResponse(rateLimitResult);
  }

  const response = await handler();
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());

  return response;
}