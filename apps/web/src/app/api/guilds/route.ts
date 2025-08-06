import type { APIUser } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { withCSRFProtection } from "@/lib/csrf";
import { DiscordUtils } from "@/lib/discord-api";
import { logger } from "@/lib/logger";
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
      logger.security("invalid_token", {
        userId: user.id,
        error: "Discord access token expired",
      });
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Fetch user's manageable guilds
    const startTime = Date.now();
    const guilds = await DiscordUtils.getManageableGuilds(
      access_token,
      user.id,
    );
    const duration = Date.now() - startTime;

    logger.discordAPI("fetch_guilds", true, {
      userId: user.id,
      duration,
      metadata: {
        guildCount: guilds.length,
      },
    });

    logger.performance("fetch_guilds", duration, {
      userId: user.id,
      guildCount: guilds.length,
    });

    return NextResponse.json({
      guilds,
      total: guilds.length,
    });
  } catch (error) {
    logger.error("Failed to fetch guilds", {
      error: error instanceof Error ? error : String(error),
    });

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
