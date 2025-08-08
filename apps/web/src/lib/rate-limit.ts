import type { NextRequest } from "next/server";

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
}

/**
 * Rate limit store using in-memory Map
 * In production, use Redis or another distributed store
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);

    // Clean up expired entries
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store.set(key, { count, resetTime });
  }

  increment(
    key: string,
    windowMs: number,
  ): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);

    if (!existing) {
      const entry = { count: 1, resetTime: now + windowMs };
      this.set(key, entry.count, entry.resetTime);
      return entry;
    }

    existing.count += 1;
    this.set(key, existing.count, existing.resetTime);
    return existing;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Global rate limit store instance
 */
const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    rateLimitStore.cleanup();
  },
  5 * 60 * 1000,
);

/**
 * Rate limiter class
 */
export class RateLimiter {
  readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(request)
      : this.#getDefaultKey(request);

    const { count, resetTime } = rateLimitStore.increment(
      key,
      this.config.windowMs,
    );

    const allowed = count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - count);

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  /**
   * Generate default key based on IP address
   */
  #getDefaultKey(request: Request): string {
    const ip = this.#getClientIP(request);
    return `rate_limit:${ip}`;
  }

  /**
   * Extract client IP address
   */
  #getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");

    return cfConnectingIP || forwarded?.split(",")[0] || realIP || "unknown";
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 login attempts per 15 minutes
  }),

  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  }),

  discord: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 Discord API calls per minute
    keyGenerator: (request) => {
      // Rate limit by user session if available
      const cookie = request.headers.get("cookie");
      if (cookie) {
        const sessionMatch = cookie.match(/session=([^;]+)/);
        if (sessionMatch) {
          return `discord_api:${sessionMatch[1].slice(0, 10)}`;
        }
      }

      // Fallback to IP-based limiting
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";
      return `discord_api:${ip}`;
    },
  }),

  strict: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute for sensitive endpoints
  }),
};

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  limiter: RateLimiter,
  handler: (request: NextRequest) => Promise<Response> | Response,
) {
  return async (request: NextRequest): Promise<Response> => {
    const { allowed, remaining, resetTime } = await limiter.check(request);

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (resetTime - Date.now()) / 1000,
            ).toString(),
            "X-RateLimit-Limit": limiter.config.maxRequests.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
          },
        },
      );
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    response.headers.set(
      "X-RateLimit-Limit",
      limiter.config.maxRequests.toString(),
    );
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(resetTime / 1000).toString(),
    );

    return response;
  };
}
