import type { APIUser } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { DiscordUtils } from "@/lib/discord-api";

interface RouteParams {
  params: { guildId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { guildId } = params;

    if (!guildId) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 },
      );
    }

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

    // Fetch guild details
    const _startTime = Date.now();
    const guild = await DiscordUtils.getEnhancedGuild(
      guildId,
      user.id,
      access_token,
    );

    if (!guild) {
      return NextResponse.json(
        { error: "Guild not found or access denied" },
        { status: 403 },
      );
    }

    return NextResponse.json(guild);
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
