import type { APIUser } from "discord-api-types/v10";
import type { JWTPayload as HonoJWTPayload } from "hono/utils/jwt/types";

export interface DiscordTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface JWTPayload extends HonoJWTPayload {
  userId: string;
  username: string;
  avatar?: string;
  discordTokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export interface AuthSession {
  user: Pick<APIUser, "id" | "username" | "avatar" | "discriminator">;
  tokens: DiscordTokens;
}
