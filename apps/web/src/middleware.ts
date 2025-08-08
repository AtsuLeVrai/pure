import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Next.js middleware for request logging and monitoring
 */
export function middleware(request: NextRequest) {
  const requestId = generateRequestId();

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
