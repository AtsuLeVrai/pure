import type {
  APIUser,
  RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=access_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?error=invalid_callback", request.url),
    );
  }

  try {
    // Verify and decode state
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString(),
    ) as { redirect: string; timestamp: number };

    // Check if state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL("/?error=expired_state", request.url),
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData =
      (await tokenResponse.json()) as RESTPostOAuth2AccessTokenResult;

    // Get user information
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user information");
    }

    const userData = (await userResponse.json()) as APIUser;

    // Create JWT session token with access token
    const sessionToken = jwt.sign(
      {
        ...userData,
        access_token: tokenData.access_token,
        token_expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
      env.JWT_SECRET,
    );

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(stateData.redirect || "/dashboard", request.url),
    );

    // Set secure HTTP-only cookie
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    logger.auth("login", {
      userId: userData.id,
      userAgent: request.headers.get("user-agent") || undefined,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return response;
  } catch (error) {
    logger.auth("failed", {
      error: error instanceof Error ? error : String(error),
      userAgent: request.headers.get("user-agent") || undefined,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });
    return NextResponse.redirect(
      new URL("/?error=authentication_failed", request.url),
    );
  }
}
