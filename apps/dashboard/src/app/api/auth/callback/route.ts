import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { orpc } from "@/utils/orpc";

/**
 * Handles Discord OAuth callback and sets authentication cookie
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code")?.trim();
  const error = searchParams.get("error");

  // Handle OAuth errors from Discord
  if (error) {
    const errorMessage =
      searchParams.get("error_description") || "OAuth authorization failed";
    return NextResponse.redirect(
      new URL(
        `/?error=OAUTH_ERROR&message=${encodeURIComponent(errorMessage)}`,
        request.url,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=AUTH_NO_CODE", request.url));
  }

  try {
    const callbackResult = await orpc.auth.callback.call({ code });

    if (!callbackResult?.token) {
      return NextResponse.redirect(
        new URL("/?error=AUTH_CALLBACK_FAILED", request.url),
      );
    }

    // Create redirect response to dashboard for authenticated users
    const redirectUrl = searchParams.get("state") || "/dashboard";
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Set secure authentication cookie
    const cookieOptions: Partial<ResponseCookie> = {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax" as const,
    };

    // Adjust cookie security based on environment
    if (process.env.NODE_ENV === "production") {
      Object.assign(cookieOptions, {
        httpOnly: true,
        secure: true,
      });
    } else {
      Object.assign(cookieOptions, {
        httpOnly: false,
        secure: false,
      });
    }

    response.cookies.set("session", callbackResult.token, cookieOptions);

    return response;
  } catch (error) {
    // Log error details for debugging while keeping user-facing message generic
    console.error("Authentication callback failed:", {
      error: error instanceof Error ? error.message : error,
      code: `${code?.substring(0, 10)}...`, // Log partial code for debugging
      timestamp: new Date().toISOString(),
    });

    return NextResponse.redirect(
      new URL("/?error=AUTH_UNEXPECTED_ERROR", request.url),
    );
  }
}
