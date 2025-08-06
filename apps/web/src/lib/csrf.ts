import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const TOKEN_LENGTH = 32;

// Generate a secure random secret for signing tokens
function signToken(token: string): string {
  const hmac = createHmac("sha256", env.JWT_SECRET);
  hmac.update(token);
  return hmac.digest("base64url");
}

// Get allowed origins for CSRF protection
function getAllowedOrigins(): string[] {
  const baseUrl = env.DISCORD_REDIRECT_URI;
  const url = new URL(baseUrl);

  return [
    url.origin,
    // Add other allowed origins here
    // "https://yourdomain.com",
  ];
}

/**
 * CSRF protection utility
 */
export const CSRFProtection = {
  /**
   * Generate a secure CSRF token
   */
  generateToken(): string {
    const token = randomBytes(TOKEN_LENGTH).toString("base64url");
    const signature = signToken(token);

    return `${token}.${signature}`;
  },

  /**
   * Verify CSRF token
   */
  verifyToken(token: string): boolean {
    if (!token || typeof token !== "string") {
      return false;
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return false;
    }

    const [tokenPart, signature] = parts;
    const expectedSignature = signToken(tokenPart);

    try {
      const tokenBuffer = Buffer.from(signature, "base64url");
      const expectedBuffer = Buffer.from(expectedSignature, "base64url");

      if (tokenBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(tokenBuffer, expectedBuffer);
    } catch {
      return false;
    }
  },

  /**
   * Extract CSRF token from request headers
   */
  getTokenFromRequest(request: Request): string | null {
    // Check X-CSRF-Token header first
    const token = request.headers.get("x-csrf-token");

    if (token) {
      return token;
    }

    // Check form data for POST requests
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type");

      if (contentType?.includes("application/x-www-form-urlencoded")) {
        // For form submissions, token would be in body
        // This is handled at the handler level
        return null;
      }
    }

    return null;
  },

  /**
   * Validate request against CSRF attack
   */
  validateRequest(request: Request): {
    valid: boolean;
    error?: string;
  } {
    const method = request.method.toUpperCase();

    // Only validate state-changing methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return { valid: true };
    }

    // Check origin header
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    if (origin) {
      const allowedOrigins = getAllowedOrigins();
      if (!allowedOrigins.includes(origin)) {
        logger.security("csrf_attempt", {
          origin,
          method,
          userAgent: request.headers.get("user-agent") || undefined,
        });
        return {
          valid: false,
          error: "Invalid origin",
        };
      }
    } else if (referer) {
      // Fallback to referer check if origin is not present
      const refererUrl = new URL(referer);
      const allowedOrigins = getAllowedOrigins();

      if (!allowedOrigins.includes(refererUrl.origin)) {
        logger.security("csrf_attempt", {
          referer,
          method,
          userAgent: request.headers.get("user-agent") || undefined,
        });
        return {
          valid: false,
          error: "Invalid referer",
        };
      }
    }

    // Check CSRF token for requests with JSON content
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const token = this.getTokenFromRequest(request);

      if (!token) {
        logger.security("csrf_attempt", {
          error: "Missing CSRF token",
          method,
          userAgent: request.headers.get("user-agent") || undefined,
        });
        return {
          valid: false,
          error: "Missing CSRF token",
        };
      }

      if (!this.verifyToken(token)) {
        logger.security("csrf_attempt", {
          error: "Invalid CSRF token",
          method,
          userAgent: request.headers.get("user-agent") || undefined,
        });
        return {
          valid: false,
          error: "Invalid CSRF token",
        };
      }
    }

    return { valid: true };
  },
} as const;

/**
 * CSRF middleware for Next.js API routes
 */
export function withCSRFProtection(
  handler: (request: Request) => Promise<Response> | Response,
) {
  return async (request: Request): Promise<Response> => {
    const validation = CSRFProtection.validateRequest(request);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: "CSRF validation failed",
          message: validation.error,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const response = await handler(request);

    // Add CSRF token to response headers for client use
    if (request.method === "GET") {
      const token = CSRFProtection.generateToken();
      response.headers.set("X-CSRF-Token", token);
    }

    return response;
  };
}
