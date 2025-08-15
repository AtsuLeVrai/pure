import type {
  APIGuild,
  APIUser,
  RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10";
import type { DiscordTokens } from "@/types/auth";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
  console.warn("⚠️  Discord OAuth environment variables not configured!");
}

export function getDiscordOAuthURL(): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID as string,
    redirect_uri: DISCORD_REDIRECT_URI as string,
    response_type: "code",
    scope: "identify guilds",
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<DiscordTokens> {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID as string,
      client_secret: DISCORD_CLIENT_SECRET as string,
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT_URI as string,
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord OAuth failed: ${response.statusText}`);
  }

  const data: RESTPostOAuth2AccessTokenResult = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshDiscordTokens(
  refreshToken: string,
): Promise<DiscordTokens> {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID as string,
      client_secret: DISCORD_CLIENT_SECRET as string,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord token refresh failed: ${response.statusText}`);
  }

  const data: RESTPostOAuth2AccessTokenResult = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function getDiscordUser(accessToken: string): Promise<APIUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Discord user: ${response.statusText}`);
  }

  return await response.json();
}

export async function getDiscordGuilds(
  accessToken: string,
): Promise<APIGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Discord guilds: ${response.statusText}`);
  }

  const guilds: APIGuild[] = await response.json();

  // Filter for admin guilds only (0x8 = ADMINISTRATOR permission)
  return guilds.filter((guild) => {
    const permissions = Number.parseInt(guild.permissions as string, 10);
    return guild.owner || (permissions & 0x8) === 0x8;
  });
}

export async function getDiscordGuild(
  guildId: string,
  accessToken: string,
): Promise<APIGuild | null> {
  try {
    const guilds = await getDiscordGuilds(accessToken);
    return guilds.find((guild) => guild.id === guildId) || null;
  } catch (_error) {
    return null;
  }
}
