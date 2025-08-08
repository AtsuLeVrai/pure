import type { APIUser } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { withCSRFProtection } from "@/lib/csrf";
import { DiscordUtils } from "@/lib/discord-api";
import { rateLimiters, withRateLimit } from "@/lib/rate-limit";

async function handleGetGuilds() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const { access_token, token_expires_at, ...user } = jwt.verify(
      sessionCookie.value,
      env.JWT_SECRET,
    ) as APIUser & {
      access_token: string;
      token_expires_at: number;
    };

    if (!user || !access_token) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check if token is expired
    if (token_expires_at && Date.now() / 1000 > token_expires_at) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Fetch user's manageable guilds
    const guilds = await DiscordUtils.getManageableGuilds(
      access_token,
      user.id,
    );

    return NextResponse.json({
      guilds,
      total: guilds.length,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(
  rateLimiters.discord,
  withCSRFProtection(handleGetGuilds),
);
