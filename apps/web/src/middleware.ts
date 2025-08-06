import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  return cfConnectingIP || forwarded?.split(",")[0] || realIP || "unknown";
}

/**
 * Next.js middleware for request logging and monitoring
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);

  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add request ID to response headers
  response.headers.set("x-request-id", requestId);

  // Log request details
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "";
  const method = request.method;
  const url = request.nextUrl.pathname;
  const query = request.nextUrl.searchParams.toString();

  logger.info(`${method} ${url}${query ? `?${query}` : ""}`, {
    method,
    url,
    query,
    userAgent,
    ip: clientIP,
    requestId,
  });

  // Performance monitoring
  const duration = Date.now() - startTime;
  logger.performance(`${method} ${url}`, duration, {
    method,
    url,
    ip: clientIP,
    userAgent,
    requestId,
  });

  return response;
}

/**
 * Matcher configuration - only run middleware on specific paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
