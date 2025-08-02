import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Generate state parameter for security
  const state = Buffer.from(
    JSON.stringify({
      redirect: redirectTo,
      timestamp: Date.now(),
    }),
  ).toString("base64url");

  const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize");
  discordAuthUrl.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
  discordAuthUrl.searchParams.set("redirect_uri", env.DISCORD_REDIRECT_URI);
  discordAuthUrl.searchParams.set("response_type", "code");
  discordAuthUrl.searchParams.set("scope", "identify email guilds");
  discordAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(discordAuthUrl.toString());
}
