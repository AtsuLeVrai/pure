import { NextResponse } from "next/server";
import { authenticateUser, getDiscordToken } from "@/lib/auth-helpers";
import { withCSRFProtection } from "@/lib/csrf";
import { DiscordUtils } from "@/lib/discord-api";
import { rateLimiters, withRateLimit } from "@/lib/rate-limit";

async function handleGetGuilds() {
  try {
    // Authenticate user using secure database session
    const authResult = await authenticateUser();

    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Not authenticated" },
        { status: 401 },
      );
    }

    // Get Discord token from encrypted database storage
    const accessToken = await getDiscordToken(authResult.user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Discord token not available or expired" },
        { status: 401 },
      );
    }

    // Fetch user's manageable guilds
    const guilds = await DiscordUtils.getManageableGuilds(
      accessToken,
      authResult.user.id,
    );

    return NextResponse.json({
      guilds,
      total: guilds.length,
    });
  } catch {
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
